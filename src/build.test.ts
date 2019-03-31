import build from "./build";
import fs from "fs-extra";
import JSZip from "jszip";
import path from "path";
import { generateUniqueTempDirPath } from "./helpers";
import { sanitizeEnv, restoreEnv } from "./testHelpers";

describe("build", () => {
  beforeEach(sanitizeEnv);
  afterEach(restoreEnv);

  it("produces a zip archive", async () => {
    const buildDir = generateUniqueTempDirPath("build-test");
    await fs.mkdirp(buildDir);
    const resultingArchive = path.resolve(buildDir, "test-lambda.zip");
    process.env.BUILD_OUTPUT = resultingArchive;
    await build();

    expect(await fs.pathExists(resultingArchive)).toBe(true);
    const zip = await JSZip.loadAsync(await fs.readFile(resultingArchive));
    expect(Object.keys(zip.files)).toEqual([
      "git-2.4.3.tar",
      "index.js",
      "LICENSE",
      "README.md",
    ]);
  }, 20000);
});
