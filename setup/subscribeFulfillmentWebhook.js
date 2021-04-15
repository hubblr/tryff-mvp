if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: require("find-config")(".env") });
}
const axios = require("axios");
const endpoint = require("./constants").endpoint;

const webhookUrl = process.env.SHOPIFY_FULFILLMENT_WEBHOOK_URL;

/* WEBHOOK CRUD */

const getWebhooksFulfillmentCreate = async () => {
  return (await axios.get(`${endpoint}/webhooks.json`)).data.webhooks.filter(
    ({ topic }) => topic === "fulfillments/create"
  );
};

const deleteWebhook = async (webhookId) => {
  await axios.delete(`${endpoint}/webhooks/${webhookId}.json`);
};

const subscribeWebhookFulfillmentCreate = async ({ url }) => {
  await axios.post(`${endpoint}/webhooks.json`, {
    webhook: {
      topic: "fulfillments/create",
      address: url,
      format: "json",
    },
  });
};

/* MAIN */

const executeSetup = async () => {
  // delete all previous webhooks for fulfillment creation
  const webhooks = await getWebhooksFulfillmentCreate();
  await Promise.all(
    webhooks.map(({ id: webhookId }) => deleteWebhook(webhookId))
  );
  // create the new webhook
  await subscribeWebhookFulfillmentCreate({ url: webhookUrl });
  console.log("SETUP FULFILLMENT WEBHOOK DONE");
};
exports.setupFulfillmentWebhook = executeSetup;

if (require.main === module) {
  executeSetup();
}
