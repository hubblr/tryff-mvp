if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: require("find-config")(".env") });
}

const path = require("path");
const fs = require("fs");
const { handler } = require("../src/lambda/carrierService/index");

const rawdata = fs.readFileSync(
  path.join(__dirname, "testData/carrier/carrier.json")
);
const cdata = JSON.parse(rawdata);

handler(cdata).then((res) => console.log(res));
