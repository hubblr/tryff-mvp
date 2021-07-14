require("dotenv").config({ path: require("find-config")(".env") });
const { rollupLambda } = require("./setup/lambdaRollup");
const { setupCarrierService } = require("./setup/createCarrierService");
const { setupWebhook } = require("./setup/subscribeWebhook");

/* MAIN */

const setup = async () => {
  // setup AWS functions with newest code
  await Promise.all([
    rollupLambda({
      lambdaFolder: "carrierService",
      lambdaName: process.env.SHOPIFY_CARRIER_SERVICE_LAMBDA_NAME,
    }),
    rollupLambda({
      lambdaFolder: "fulfillmentWebhook",
      lambdaName: process.env.SHOPIFY_FULFILLMENT_WEBHOOK_LAMBDA_NAME,
    }),
  ]);
  // connect to shopify
  await Promise.all([
    setupCarrierService(),
    setupWebhook({
      url: process.env.SHOPIFY_FULFILLMENT_WEBHOOK_URL,
      topic: "fulfillments/create",
    }),
  ]);
};

setup();
