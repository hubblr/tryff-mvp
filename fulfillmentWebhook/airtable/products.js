const { base } = require("./base");

/* AIRTABLE PRODUCT CRUD */

exports.getAirtableProductIdByVendorAndName = async ({
  productName,
  vendorName,
}) => {
  return new Promise((resolve, reject) => {
    base("Products")
      .select({
        view: "Data",
        filterByFormula: `product = "${productName} ${vendorName}"`,
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
        });
      });
  });
};
