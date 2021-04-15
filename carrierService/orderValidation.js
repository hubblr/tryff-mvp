const { getAirtableStockById } = require("./airtable/stock");
const {
  getAirtableLocalWarehouse,
  getAirtableLocalWarehouseOpeningHours,
} = require("./airtable/localWarehouse");
const { getCurrentTime, isNowWithinTimeInterval } = require("./helpers");

/* DETERMINE AVAILABLE STOCK AND WAREHOUSE FOR A PRODUCT */

const getStockInfoForIds = async ({ stockIds }) => {
  // get info of all available stock of this product
  return (
    await Promise.allSettled(
      stockIds.map(async (stockId) => {
        const { localWarehouseId, quantity } = await getAirtableStockById(
          stockId
        );

        const localWarehouse = await getAirtableLocalWarehouse(
          localWarehouseId
        );
        return {
          quantity,
          localWarehouse,
        };
      })
    )
  ).map(({ value }) => value);
};

/* DETERMINE IF A LOCAL WAREHOUSE IS CURRENTLY OPEN DEPENDING ON ITS OPENING HOUR INTERVALS */

const isLocalWarehouseOpen = async ({ storeName }) => {
  const curDay = getCurrentTime().getDay();
  const openingHours = await getAirtableLocalWarehouseOpeningHours({
    storeName,
    day: curDay,
  });
  if (!openingHours.length) {
    return false;
  }
  for (const openingHourInterval of openingHours) {
    if (isNowWithinTimeInterval(openingHourInterval)) {
      return true;
    }
  }
  return false;
};

/* CHECK IF A GIVEN ORDER CAN BE PROCESSED */

const validateOrder = async ({ items, destinationZip }) => {
  const res = {
    canLocalWarehouseFulfillOrder: false,
    localWarehouseName: "",
  };

  // find potential warehouses
  const stockInfo = (
    await Promise.allSettled(
      items.map(({ stockIds }) =>
        getStockInfoForIds({
          stockIds,
        })
      )
    )
  ).map(({ value }) => value);

  // validate items and simultaneously find local warehouse to handle order
  let orderLocalWarehouse;
  for (const potentialLocalWarehouses of stockInfo) {
    let correctEntry;
    for (const entry of potentialLocalWarehouses) {
      if (!orderLocalWarehouse) {
        if (entry.localWarehouse.deliveryZipCodes.includes(destinationZip)) {
          orderLocalWarehouse = entry.localWarehouse;
          correctEntry = entry;
          break;
        }
      } else {
        if (orderLocalWarehouse.id === entry.localWarehouse.id) {
          correctEntry = entry;
          break;
        }
      }
    }

    if (!correctEntry || !correctEntry.quantity || correctEntry.quantity <= 0) {
      return res;
    }
  }

  // get information to pass from the determined local warehouse
  const localWarehouseName = orderLocalWarehouse.name;

  // check opening hours of local warehouse
  if (!(await isLocalWarehouseOpen({ storeName: localWarehouseName }))) {
    return res;
  }

  // order can be fulfilled by the store
  return {
    canLocalWarehouseFulfillOrder: true,
    localWarehouseName: orderLocalWarehouse.name,
  };
};

exports.validateOrder = validateOrder;
