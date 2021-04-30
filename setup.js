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
    setupWebhook({
      url: process.env.SHOPIFY_PRODUCT_CREATE_WEBHOOK_URL,
      topic: "products/create",
    }),
    setupWebhook({
      url: process.env.SHOPIFY_PRODUCT_UPDATE_WEBHOOK_URL,
      topic: "products/update",
    }),
    setupWebhook({
      url: process.env.SHOPIFY_PRODUCT_DELETE_WEBHOOK_URL,
      topic: "products/delete",
    }),
  ]);
};

setup();
