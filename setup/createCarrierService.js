if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: require("find-config")(".env") });
}
const axios = require("axios");
const endpoint = require("./constants").endpoint;

const carrierServiceName = process.env.SHOPIFY_CARRIER_SERVICE_NAME;
const carrierServiceUrl = process.env.SHOPIFY_CARRIER_SERVICE_URL;

/* CARRIER SERVICE CRUD */

const getCarrierServices = async () => {
  return (await axios.get(`${endpoint}/carrier_services.json`)).data
    .carrier_services;
};

const deleteCarrierServices = async (serviceIds) => {
  const requests = serviceIds.map((id) => {
    return axios.delete(`${endpoint}/carrier_services/${id}.json`);
  });
  await Promise.allSettled(requests);
};

const createCarrierService = async ({ name, callbackUrl }) => {
  await axios.post(`${endpoint}/carrier_services.json`, {
    carrier_service: {
      name,
      callback_url: callbackUrl,
      service_discovery: true,
    },
  });
};

/* MAIN */

const executeSetup = async () => {
  // delete all previous carrier services
  const services = await getCarrierServices();
  const serviceIds = services.map(({ id }) => id);
  await deleteCarrierServices(serviceIds);
  // create the new carrier service
  await createCarrierService({
    name: carrierServiceName,
    callbackUrl: carrierServiceUrl,
  });
  console.log("SETUP CARRIER SERVICE DONE");
};
exports.setupCarrierService = executeSetup;

if (require.main === module) {
  executeSetup();
}
