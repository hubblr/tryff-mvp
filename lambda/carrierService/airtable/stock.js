const { base } = require("./base");

/* AIRTABLE STOCK CRUD */

exports.getAirtableStockById = (stockId) => {
  return new Promise((resolve, reject) => {
    base("Stock").find(stockId, function (err, record) {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }

      resolve({
        localWarehouseId: record.get("local_warehouse")[0],
        quantity: record.get("quantity"),
      });
    });
  });
};
