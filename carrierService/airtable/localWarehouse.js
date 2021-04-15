const { base } = require("./base");
const { mapDateToDateString } = require("../helpers");

/* AIRTABLE LOCAL WAREHOUSE CRUD */

exports.getAirtableLocalWarehouse = (id) => {
  return new Promise((resolve, reject) => {
    base("Local Warehouse").find(id, function (err, record) {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }

      const id = record.id;

      resolve({
        id: Array.isArray(id) ? id[0] : id,
        name: record.get("name"),
        deliveryZipCodes: record
          .get("delivery_zip_codes")
          .map((zipStr) => zipStr.trim()),
        openingHourIds: record.get("opening_hours"),
      });
    });
  });
};

/* AIRTABLE LOCAL WAREHOUSE OPENING HOURS CRUD */

exports.getAirtableLocalWarehouseOpeningHours = async ({ storeName, day }) => {
  return new Promise((resolve, reject) => {
    const dayString = mapDateToDateString(day);
    const openingHours = [];

    base("Local Warehouse Opening Hours")
      .select({
        view: "Data",
        filterByFormula: `FIND("${storeName} ${dayString}", name) != 0`,
      })
      .eachPage(
        function page(records, fetchNextPage) {
          records.forEach(function (record) {
            openingHours.push({
              startTime: record.get("start_time"),
              endTime: record.get("end_time"),
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
          resolve(openingHours);
        }
      );
  });
};
