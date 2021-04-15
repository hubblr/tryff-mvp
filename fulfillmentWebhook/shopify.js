const axios = require("axios");
const endpoint = require("./constants").endpoint;

/* SHOPIFY ORDER CRUD */

exports.getShopifyOrder = async (orderId) => {
  const order = await axios.get(`${endpoint}/orders/${orderId}.json`);
  const orderData = order.data.order;
  const shippingData = orderData.shipping_lines[0];

  return {
    name: orderData.name,
    deliveryMethod: {
      name: shippingData.title,
      type: shippingData.code,
    },
  };
};

/* SHOPIFY FULFILLMENT CRUD */

exports.completeShopifyFulfillment = async ({ orderId, fulfillmentId }) => {
  await axios.post(
    `${endpoint}/orders/${orderId}/fulfillments/${fulfillmentId}/complete.json`
  );
};
