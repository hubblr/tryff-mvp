const path = require("path");
const { promisify } = require("util");
const exec = promisify(require("child_process").exec);
const fs = require("fs");
const rollup = require("rollup");
const resolve = require("rollup-plugin-node-resolve");
const commonjs = require("rollup-plugin-commonjs");

const lambdaBaseDir = path.join(process.cwd(), "src/lambda");

const createDirBasedExec = (dir) => {
  return (cmd) => {
    return exec(cmd, { cwd: dir });
  };
};

const installNodeModules = async (dir) => {
  const execInDir = createDirBasedExec(dir);
  await execInDir("npm i");
};

const updateLambdaFunction = async ({
  dir,
  distDir,
  distFileName,
  functionName,
  zipName,
}) => {
  const execInDir = createDirBasedExec(dir);
  const execInDist = createDirBasedExec(distDir);
  const zipPath = path.join(distDir, zipName);
  await execInDist(`rm ${zipPath} ||:`);
  await execInDir(`zip -r ${zipPath} node_modules`);
  await execInDist(`zip -ur ${zipPath} ${distFileName}`);
  await execInDist(
    `aws lambda update-function-code --function-name ${functionName} --zip-file fileb://${zipName}`
  );
};

exports.rollupLambda = async ({ lambdaFolder, lambdaName }) => {
  const dir = path.join(lambdaBaseDir, lambdaFolder);
  // input
  const indexPath = path.join(dir, "index.js");
  const nodeModules = path.join(dir, "node_modules");
  const pkgPath = path.join(dir, "package.json");
  const pkg = require(pkgPath);

  const inputOptions = {
    input: indexPath,
    external: Object.keys(pkg.dependencies),
    plugins: [resolve(), commonjs()],
  };

  // output / dist
  const distDir = path.join(dir, "dist");
  const distFileName = "index.js";
  const distFile = path.join(distDir, distFileName);
  const zipName = "function.zip";

  const outputOptions = {
    file: distFile,
    format: "cjs",
    exports: "named",
  };

  // complete any missing folders
  if (!fs.existsSync(nodeModules)) {
    console.log("missing node modules");
    await installNodeModules(dir);
  }

  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
  }

  // bundle files in dist folder
  const bundle = await rollup.rollup(inputOptions);
  await bundle.write(outputOptions);
  await bundle.close();

  // update lambda function with bundle
  await updateLambdaFunction({
    dir,
    distDir,
    distFileName,
    functionName: lambdaName,
    zipName,
  });
};
