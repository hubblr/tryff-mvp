const { base } = require("./base");
const { getAirtableProductByNameAndVendor } = require("./products");
const { randomNumberString } = require("../../helpers");

/* AIRTABLE ORDER CRUD */

const createAirtableOrder = ({
  orderName,
  deliveryMethod: { type: deliveryMethodType },
  customerInfo: { firstName, lastName, address, email, phone },
  vendorTableId,
  warehouseTableId,
}) => {
  const internalOrderId = parseInt(randomNumberString(14));

  return new Promise((resolve, reject) => {
    base("Order").create(
      [
        {
          fields: {
            order_id: internalOrderId,
            order_name: orderName,
            order_item: [],
            delivery_method: deliveryMethodType,
            status: "open",
            first_name: firstName,
            last_name: lastName,
            address,
            email,
            phone,
            vendor: [vendorTableId],
            warehouse: [warehouseTableId],
            deliveries: [],
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err);
          reject(err);
          return;
        }
        const record = records[0];
        resolve({
          id: record.id,
        });
      }
    );
  });
};

const updateAirtableOrder = async ({
  orderTableId,
  orderItemIds,
  deliveryIds,
}) => {
  return new Promise((resolve, reject) => {
    base("Order").update(
      [
        {
          id: orderTableId,
          fields: {
            order_item: orderItemIds,
            deliveries: deliveryIds,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err);
          reject(err);
          return;
        }
        resolve();
      }
    );
  });
};

/* AIRTABLE ORDER ITEM CRUD */

const createAirtableOrderItem = ({
  orderTableId,
  productTableId,
  quantity,
}) => {
  const internalOrderItemId = parseInt(randomNumberString(9));

  return new Promise((resolve, reject) => {
    base("OrderItem").create(
      [
        {
          fields: {
            order_item_id: internalOrderItemId,
            quantity,
            order: [orderTableId],
            products: [productTableId],
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err);
          reject(err);
          return;
        }
        const record = records[0];
        resolve({
          id: record.id,
        });
      }
    );
  });
};

/* AIRTABLE DELIVERY CRUD */

const createAirtableDelivery = async ({ orderTableId }) => {
  return new Promise((resolve, reject) => {
    const internalDeliveryId = parseInt(randomNumberString(12));

    base("Deliveries").create(
      [
        {
          fields: {
            delivery_id: internalDeliveryId,
            order: [orderTableId],
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err);
          reject(err);
          return;
        }
        const record = records[0];
        resolve({
          id: record.id,
        });
      }
    );
  });
};

/* CREATE ALL RELEVANT AIRTABLE TABLES FOR AN ORDER */

exports.createAirtableTablesForOrder = async ({
  vendorName,
  orderCreationInfo,
  itemInfo,
}) => {
  // create the initial order table entry
  const { id: orderTableId } = await createAirtableOrder(orderCreationInfo);

  // create table entries for all order items
  const orderItemIds = await Promise.all(
    itemInfo.map(async ({ name: productName, quantity }) => {
      const { id: productTableId } = await getAirtableProductByNameAndVendor({
        productName,
        vendorName,
      });
      return (
        await createAirtableOrderItem({
          orderTableId,
          productTableId,
          quantity: quantity.toString(),
        })
      ).id;
    })
  );

  // create table entry for delivery
  const deliveryId = (await createAirtableDelivery({ orderTableId })).id;

  // update order table entry with IDs of order items and delivery
  await updateAirtableOrder({
    orderTableId,
    orderItemIds,
    deliveryIds: [deliveryId],
  });
};
