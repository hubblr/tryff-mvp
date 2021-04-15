const { base } = require("./base");
const { normalizePrice } = require("../helpers");

/* AIRTABLE VENDOR CHECKOUT OPTIONS CRUD */

const getAirtableVendorCheckoutOption = ({ id, cartValue }) => {
  return new Promise((resolve, reject) => {
    base("Vendor Checkout Options").find(id, function (err, record) {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }

      // adjust delivery price if delivery can be performed for free
      let totalPrice = normalizePrice(record.get("total_price"));
      if (totalPrice) {
        const freeDeliveryCartValue = normalizePrice(
          record.get("free_delivery_cart_value")
        );
        if (freeDeliveryCartValue && cartValue > freeDeliveryCartValue) {
          totalPrice = 0;
        }
      }

      resolve({
        type: record.get("Type"),
        serviceName: record.get("service_name"),
        descriptionWithVariables: record.get("description with variables"),
        latestOrderTime: record.get(
          "latest_order_time_for_same_day_processing"
        ),
        deliveryWindowEarliest: record.get("delivery_window_earliest"),
        deliveryWindowLatest: record.get("delivery_window_latest"),
        totalPrice,
      });
    });
  });
};

/* AIRTABLE VENDOR CRUD */

exports.getAirtableVendorByName = async ({ name, cartValue }) => {
  const vendorData = await new Promise((resolve, reject) => {
    base("Vendor")
      .select({
        filterByFormula: `name = "${name}"`,
      })
      .firstPage(function (err, records) {
        if (err) {
          console.error(err);
          reject(err);
          return;
        }
        const record = records[0];
        resolve({
          id: record.id,
          checkoutOptionIds: record.get("checkout_options"),
        });
      });
  });

  const checkoutOptionRequests = vendorData.checkoutOptionIds.map((id) => {
    return getAirtableVendorCheckoutOption({ id, cartValue });
  });
  vendorData.checkoutOptions = (
    await Promise.allSettled(checkoutOptionRequests)
  ).map(({ value }) => value);
  return vendorData;
};
