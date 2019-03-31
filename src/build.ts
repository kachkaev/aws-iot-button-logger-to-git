import envalid from "envalid";
import fs from "fs-extra";
import Bundler from "parcel-bundler";
import path from "path";
import JSZip from "jszip";

import { generateUniqueTempDirPath } from "./helpers";

const build = async () => {
  const { BUILD_OUTPUT } = envalid.cleanEnv(
    process.env,
    {
      BUILD_OUTPUT: envalid.str({
        desc: "Location of the zip archive to produce",
        default: "lambda.zip",
      }),
    },
    {
      ...(process.env.NODE_ENV === "test" && { dotEnvPath: null }),
    },
  );

  const buildOutDir = generateUniqueTempDirPath("build");

  // Produce compiled JavaScript handle
  const bundler = new Bundler(path.resolve(__dirname, "handler.ts"), {
    bundleNodeModules: true,
    global: "handler",
    logLevel: 1,
    minify: true,
    outDir: buildOutDir,
    sourceMaps: false,
    target: "node",
    watch: false,
  });
  await bundler.bundle();

  // Produce ZIP archive with the handler and git binary
  const zip = new JSZip();
  zip.file(
    "git-2.4.3.tar",
    fs.createReadStream(
      path.resolve(__dirname, "../node_modules/lambda-git/git-2.4.3.tar"),
    ),
    {
      binary: true,
    },
  );
  zip.file(
    "index.js",
    fs.createReadStream(path.resolve(buildOutDir, "handler.js")),
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

/* istanbul ignore if */
if ((process.mainModule || ({} as any)).filename === __filename) {
  build();
}

export default build;
