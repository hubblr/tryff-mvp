if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: require("find-config")(".env") });
}
const { prepareRelevantInformationCarrierService } = require("./preparation");
const { validateOrder } = require("./orderValidation");
const { determineVendorRates } = require("./rates");
const { updateAirtableCarrierRequests } = require("./airtable/carrierRequests");
const { calcCartValue } = require("./helpers");

/* MAIN */

exports.handler = async function ({ rate: carrierInfo }) {
  const response = {
    rates: [],
  };

  try {
    // prepare necessary information for further calls
    const vendorName = carrierInfo.origin.company_name;
    const cartValue = calcCartValue(carrierInfo.items);
    const { vendor, items } = await prepareRelevantInformationCarrierService({
      vendorName,
      cartValue,
      shopifyItemArr: carrierInfo.items,
    });

    // validate if the order can be fulfilled (and by which local warehouse)
    const destinationZip = carrierInfo.destination.postal_code;

    const {
      canLocalWarehouseFulfillOrder,
      localWarehouseName,
    } = await validateOrder({
      vendorName,
      items,
      destinationZip,
    });

    if (!canLocalWarehouseFulfillOrder) {
      return response;
    }

    // fetch possible rates offered by the vendor
    const rates = await determineVendorRates({
      checkoutOptions: vendor.checkoutOptions,
      localWarehouseName,
    });

    // write the fetched rates into airtable
    await updateAirtableCarrierRequests({ vendorId: vendor.id, rates, items });

    // update response
    response.rates = rates;
  } catch (e) {
    console.log("Error during rate calculation");
    console.log(e);
  }

  return response;
};
