const {
  getAirtableStockByVendorAndProduct,
  reduceStockQuantity,
} = require("../../api-calls/airtable/stock");
const {
  getAirtableVendorByName,
  getAirtableVendorCheckoutOptions,
} = require("../../api-calls/airtable/vendor");
const {
  getAirtableLocalWarehouse,
} = require("../../api-calls/airtable/localWarehouse");
const {
  createAirtableTablesForOrder,
} = require("../../api-calls/airtable/order");
const {
  getShopifyOrder,
  completeShopifyFulfillment,
} = require("../../api-calls/shopify");
const { sendSlackNotification } = require("../../api-calls/slack");

/* DISCERN FULFILLMENT INFO FROM POSSIBLE TYPES OF PAYLOADS */

const getFulfillmentInfoFromPayload = (payload) => {
  // payload from sqs
  if (payload.hasOwnProperty("Records")) {
    return JSON.parse(payload.Records[0].body);
  }
  // regular payload from direct call / test
  return payload;
};

/* FIND THE WAREHOUSE RESPONSIBLE FOR THIS ORDER */

const getLocalWarehouseForFulfillment = async ({
  vendorName,
  sampleItem,
  destinationZip,
}) => {
  // find candidates for local warehouse based on vendor and product name
  const productName = sampleItem.title;
  const potentialLocalWarehouseIds = await getAirtableStockByVendorAndProduct({
    vendorName,
    productName,
  });

  // TODO: optimize lookups if item can be in >> 5 stores
  const potentialLocalWarehouses = (
    await Promise.allSettled(
      potentialLocalWarehouseIds.map(({ localWarehouseId }) =>
        getAirtableLocalWarehouse(localWarehouseId)
      )
    )
  ).map(({ value }) => value);

  // check if any potential warehouse delivers to our destination, otherwise return null
  for (const potentialLocalWarehouse of potentialLocalWarehouses) {
    if (potentialLocalWarehouse.deliveryZipCodes.includes(destinationZip)) {
      return potentialLocalWarehouse;
    }
  }
  return null;
};

/* MAIN */

exports.handler = async function (payload) {
  const fulfillmentInfo = getFulfillmentInfoFromPayload(payload);

  // get id of fulfillment itself
  const fulfillmentId = fulfillmentInfo.id;

  // get id of order
  const orderId = fulfillmentInfo.order_id;

  // reduce given fulfillment info to necessary customer info
  const destinationInfo = fulfillmentInfo.destination;
  const customerInfo = {
    firstName: destinationInfo.first_name,
    lastName: destinationInfo.last_name,
    address: `${destinationInfo.address1}, ${destinationInfo.zip} ${destinationInfo.city}`,
    email: fulfillmentInfo.email,
    phone: destinationInfo.phone,
  };

  // get vendor info
  const sampleItem = fulfillmentInfo.line_items[0];
  const vendorName = sampleItem.origin_location.name;

  // get delivery info
  const destinationZip = fulfillmentInfo.destination.zip;

  // combine API calls for further information
  const prepInfo = await Promise.all([
    getShopifyOrder(orderId),
    getAirtableVendorByName({ vendorName }),
    getLocalWarehouseForFulfillment({
      vendorName,
      sampleItem,
      destinationZip,
    }),
  ]);

  const { name: orderName, deliveryMethod } = prepInfo[0];
  const { id: vendorTableId, vendorId: internalVendorId } = prepInfo[1];
  const localWarehouse = prepInfo[2];

  // check whether Tryff handles this fulfillment and stop processing if not
  const potentialCheckoutOptions = (
    await getAirtableVendorCheckoutOptions({
      vendorId: internalVendorId,
      localWarehouseName: localWarehouse.name,
    })
  ).map(({ serviceName }) => serviceName);
  if (!potentialCheckoutOptions.includes(deliveryMethod.name)) {
    return;
  }

  // perform required fulfillment actions in parallel
  await Promise.allSettled([
    reduceStockQuantity({
      vendorName,
      itemInfo: fulfillmentInfo.line_items,
      localWarehouse,
    }),
    createAirtableTablesForOrder({
      vendorName,
      orderCreationInfo: {
        orderName,
        deliveryMethod,
        customerInfo,
        vendorTableId,
        warehouseTableId: localWarehouse.id,
      },
      itemInfo: fulfillmentInfo.line_items,
    }),
    sendSlackNotification({
      orderName,
      deliveryMethod,
      customerInfo,
      itemInfo: fulfillmentInfo.line_items,
      slackChannel: localWarehouse.slackChannel,
    }),
    completeShopifyFulfillment({ orderId, fulfillmentId }),
  ]);
};
