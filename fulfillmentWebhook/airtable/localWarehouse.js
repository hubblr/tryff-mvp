const { base } = require("./base");

/* AIRTABLE LOCAL WAREHOUSE CRUD */

exports.getAirtableLocalWarehouse = (id) => {
  return new Promise((resolve, reject) => {
    base("Local Warehouse").find(id, function (err, record) {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }
      resolve({
        id: record.id,
        warehouseId: record.get("warehouse_id"),
        name: record.get("name"),
        deliveryZipCodes: record
          .get("delivery_zip_codes")
          .map((record) => record.trim()),
        slackChannel: record.get("slack_channel"),
      });
    });
  });
};
