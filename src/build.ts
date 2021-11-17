import * as envalid from "envalid";
import fs from "fs-extra";
import Parcel from "@parcel/core";
import path from "path";
import JSZip from "jszip";
import { autoStartCommandIfNeeded } from "@kachkaev/commands";
import dotenv from "dotenv";

import { generateUniqueTempDirPath } from "./helpers";

const build = async () => {
  if (process.env.NODE_ENV !== "test") {
    dotenv.config();
  }
  const { BUILD_OUTPUT } = envalid.cleanEnv(process.env, {
    BUILD_OUTPUT: envalid.str({
      desc: "Location of the zip archive to produce",
      default: "lambda.zip",
    }),
  });

  const buildOutDir = generateUniqueTempDirPath("build");

  // Produce compiled JavaScript handle
  const bundler = new Parcel({
    entries: path.resolve(__dirname, "handler.ts"),
    logLevel: "error",
    mode: "production",
    defaultConfig: "@parcel/config-default",

    targets: {
      default: {
        distDir: buildOutDir,
        outputFormat: "commonjs",
        optimize: true,
        includeNodeModules: true,
        engines: {
          node: require("../package.json").engines.node,
        },
      },
    },
  });
  await bundler.run();

  // Produce ZIP archive with the handler and git binary
  const zip = new JSZip();
  zip.file(
    "index.js",
    fs.createReadStream(path.resolve(buildOutDir, "handler.js")),
  );
  zip.file(
    "CHANGELOG.md",
    fs.createReadStream(path.resolve(__dirname, "../CHANGELOG.md")),
  );
  zip.file(
    "LICENSE",
    fs.createReadStream(path.resolve(__dirname, "../LICENSE")),
  );
  zip.file(
    "README.md",
    "# AWS IoT Button logger to git\n\nSee https://github.com/kachkaev/aws-iot-button-logger-to-git/\n",
  );
  const content = await zip.generateAsync({ type: "nodebuffer" });

  // Save the archive
  await fs.writeFile(BUILD_OUTPUT, content);
};

autoStartCommandIfNeeded(build, __filename);

export default build;
