if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: require("find-config")(".env") });
}
const axios = require("axios");
const endpoint = require("./constants").endpoint;

/* WEBHOOK CRUD */

const getWebhooksForTopic = async (givenTopic) => {
  return (await axios.get(`${endpoint}/webhooks.json`)).data.webhooks.filter(
    ({ topic }) => topic === givenTopic
  );
};

const deleteWebhook = async (webhookId) => {
  await axios.delete(`${endpoint}/webhooks/${webhookId}.json`);
};

const subscribeWebhookForTopic = async ({ url, topic }) => {
  await axios.post(`${endpoint}/webhooks.json`, {
    webhook: {
      topic,
      address: url,
      format: "json",
    },
  });
};

/* MAIN */

exports.setupWebhook = async ({ url, topic }) => {
  // delete all previous webhooks for fulfillment creation
  const webhooks = await getWebhooksForTopic(topic);
  await Promise.all(
    webhooks.map(({ id: webhookId }) => deleteWebhook(webhookId))
  );
  // create the new webhook
  await subscribeWebhookForTopic({ url, topic });
};
