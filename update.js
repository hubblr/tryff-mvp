require("dotenv").config({ path: require("find-config")(".env") });
const path = require("path");
const { promisify } = require("util");
const exec = promisify(require("child_process").exec);
const { setupCarrierService } = require("./setup/createCarrierService");
const {
  setupFulfillmentWebhook,
} = require("./setup/subscribeFulfillmentWebhook");

/* UPDATE OF THE VARIOUS LAMBDA FUNCTIONS WITH NEWEST CODE */

const createDirBasedExec = (dir) => {
  return (cmd) => {
    return exec(cmd, { cwd: dir });
  };
};

const updateLambdaFunction = async ({ dir, functionName }) => {
  const execInDir = createDirBasedExec(dir);
  await execInDir("rm function.zip ||:");
  await execInDir("zip -r function.zip .");
  return await execInDir(
    `aws lambda update-function-code --function-name ${functionName} --zip-file fileb://function.zip`
  );
};

const updateCarrierService = async () => {
  const carrierDir = path.join(__dirname, "carrierService");
  const res = await updateLambdaFunction({
    dir: carrierDir,
    functionName: process.env.SHOPIFY_CARRIER_SERVICE_LAMBDA_NAME,
  });
  console.log("UPDATE CARRIER SERVICE");
  console.log(res.stdout);
};

const updateFulfillmentWebhook = async () => {
  const fulfillmentDir = path.join(__dirname, "fulfillmentWebhook");
  const res = await updateLambdaFunction({
    dir: fulfillmentDir,
    functionName: process.env.SHOPIFY_FULFILLMENT_WEBHOOK_LAMBDA_NAME,
  });
  console.log("UPDATE FULFILLMENT WEBHOOK");
  console.log(res.stdout);
};

/* MAIN */

const update = async () => {
  // update AWS functions with newest code
  await Promise.all([updateCarrierService(), updateFulfillmentWebhook()]);
  // connect to shopify
  await Promise.all([setupCarrierService(), setupFulfillmentWebhook()]);
};

update();
