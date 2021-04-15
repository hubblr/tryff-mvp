const { getAirtableVendorByName } = require("./airtable/vendor");
const { getAirtableProductByNameAndVendor } = require("./airtable/products");

/* EXTEND GIVEN SHOPIFY ITEM INFORMATION WITH AIRTABLE DATA */

const extendItemInfo = ({ vendorName, shopifyItemArr }) => {
  return Promise.all(
    shopifyItemArr.map(async (item) => {
      const addedInfo = await getAirtableProductByNameAndVendor({
        productName: item.name,
        vendorName,
      });
      addedInfo.airtable_product_id = addedInfo.productId;
      delete addedInfo.productId;
      return { ...item, ...addedInfo };
    })
  );
};

/* FIND INFORMATION RELEVANT FOR FURTHER CALLS IN CARRIER SERVICE WORKFLOW */

exports.prepareRelevantInformationCarrierService = async ({
  vendorName,
  cartValue,
  shopifyItemArr,
}) => {
  const prepInfo = await Promise.all([
    getAirtableVendorByName({ name: vendorName, cartValue }),
    extendItemInfo({ vendorName, shopifyItemArr }),
  ]);
  return {
    vendor: prepInfo[0],
    items: prepInfo[1],
  };
};
