if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: require("find-config")(".env") });
}

const path = require("path");
const fs = require("fs");
const { handler } = require("../src/lambda/fulfillmentWebhook/index");

const rawdata = fs.readFileSync(
  path.join(__dirname, "testData/fulfillment/tryff-checkout.json")
);
const fdata = JSON.parse(rawdata);

handler(fdata).then((res) => console.log(res));
