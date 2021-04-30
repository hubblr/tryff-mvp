const { base } = require("./base");
const { fillDynamicText, normalizePrice } = require("../../helpers");

/* AIRTABLE VENDOR CHECKOUT OPTIONS CRUD */

exports.getAirtableVendorCheckoutOptions = ({
  vendorId,
  localWarehouseName,
}) => {
  return new Promise((resolve, reject) => {
    const vendorCheckoutOptions = [];

    base("Vendor Checkout Options")
      .select({
        filterByFormula: `vendor_id = "${vendorId}"`,
        view: "Data",
      })
      .eachPage(
        function page(records, fetchNextPage) {
          records.forEach(function (record) {
            vendorCheckoutOptions.push({
              serviceName: fillDynamicText(record.get("service_name"), {
                local_warehouse_name: localWarehouseName,
              }).trim(),
            });
          });

          fetchNextPage();
        },
        function done(err) {
          if (err) {
            console.error(err);
            reject(err);
            return;
          }
          resolve(vendorCheckoutOptions);
        }
      );
  });
};

const getAirtableVendorCheckoutOptionById = ({ id, cartValue }) => {
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

exports.getAirtableVendorByName = async ({
  vendorName,
  cartValue,
  fetchCheckoutOptions = false,
}) => {
  const vendorData = await new Promise((resolve, reject) => {
    base("Vendor")
      .select({
        filterByFormula: `name = "${vendorName}"`,
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
          vendorId: record.get("vendor_id"),
          checkoutOptionIds: record.get("checkout_options"),
        });
      });
  });

  if (fetchCheckoutOptions) {
    const checkoutOptionRequests = vendorData.checkoutOptionIds.map((id) => {
      return getAirtableVendorCheckoutOptionById({ id, cartValue });
    });
    vendorData.checkoutOptions = (
      await Promise.allSettled(checkoutOptionRequests)
    ).map(({ value }) => value);
  }

  return vendorData;
};
