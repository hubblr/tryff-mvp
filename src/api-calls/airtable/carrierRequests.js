const { base } = require("./base");
const { randomNumberString } = require("../../helpers");

/* AIRTABLE _CARRIER REQUESTS CRUD */

const createAirtableCarrierRequest = async ({
  rates,
  carrierRequestProductIds,
}) => {
  const requestId = randomNumberString(10);

  const fieldInfo = rates.map((rate) => {
    return {
      fields: {
        request_id: requestId,
        displayed_carrier_service_name: rate.service_name,
        displayed_carrier_description: rate.description,
        displayed_carrier_fee: rate.total_price / 100,
        requested_products: carrierRequestProductIds,
      },
    };
  });

  return new Promise((resolve, reject) => {
    base("_Carrier Requests").create(fieldInfo, function (err) {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }
      resolve();
    });
  });
};

/* AIRTABLE _CARRIER REQUESTS PRODUCT CRUD */

const createAirtableCarrierRequestProducts = async ({ vendorId, items }) => {
  const fieldInfo = items.map(({ name, sku, product_id: productId, price }) => {
    return {
      fields: {
        name,
        sku,
        product_id: productId,
        vendor: [vendorId],
        price: price / 100,
      },
    };
  });

  return new Promise((resolve, reject) => {
    base("_Carrier Requests Products").create(
      fieldInfo,
      function (err, records) {
        if (err) {
          console.error(err);
          reject(err);
          return;
        }
        resolve(records.map(({ id }) => id));
      }
    );
  });
};

/* UPDATE AIRTABLE TABLES TRACKING CARRIER REQUEST INFO */

exports.updateAirtableCarrierRequests = async ({ vendorId, rates, items }) => {
  const carrierRequestProductIds = await createAirtableCarrierRequestProducts({
    vendorId,
    items,
  });
  await createAirtableCarrierRequest({ rates, carrierRequestProductIds });
};
