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

const getAirtableStockByVendorAndProduct = ({
  vendorName,
  productName,
  localWarehouseId,
}) => {
  return new Promise((resolve, reject) => {
    let filter = `ARRAYJOIN(product_names, "") = "${productName} ${vendorName}"`;
    if (localWarehouseId) {
      const localWarehouseFilter = `ARRAYJOIN(local_warehouse_id, ",") = "${localWarehouseId}"`;
      filter = `AND(${localWarehouseFilter}, ${filter})`;
    }

    const stock = [];

    base("Stock")
      .select({
        view: "Data",
        filterByFormula: filter,
      })
      .eachPage(
        function page(records, fetchNextPage) {
          records.forEach(function (record) {
            stock.push({
              id: record.id,
              localWarehouseId: record.get("local_warehouse")[0],
              quantity: record.get("quantity"),
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

          resolve(stock);
        }
      );
  });
};
exports.getAirtableStockByVendorAndProduct = getAirtableStockByVendorAndProduct;

const updateAirtableStock = ({ tableId, quantity }) => {
  return new Promise((resolve, reject) => {
    base("Stock").update(
      [
        {
          id: tableId,
          fields: {
            quantity,
          },
        },
      ],
      function (err) {
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

exports.reduceStockQuantity = async ({
  vendorName,
  itemInfo,
  localWarehouse,
}) => {
  return await Promise.allSettled(
    itemInfo.map(async ({ name: productName, quantity: orderedQuantity }) => {
      const { id: tableId, quantity: stockQuantity } = (
        await getAirtableStockByVendorAndProduct({
          vendorName,
          productName,
          localWarehouseId: localWarehouse.warehouseId,
        })
      )[0];
      await updateAirtableStock({
        tableId,
        quantity: stockQuantity - orderedQuantity,
      });
    })
  );
};
