const { base } = require("./base");
const { fillDynamicText } = require("../helpers");

/* AIRTABLE VENDOR CRUD */

exports.getAirtableVendorByName = (vendorName) => {
  return new Promise((resolve, reject) => {
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
        });
      });
  });
};

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
