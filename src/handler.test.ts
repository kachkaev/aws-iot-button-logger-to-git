import fs from "fs-extra";
import os from "os";
import path from "path";
import { handler } from "./handler";
import {
  createTemporaryRepository,
  generateHandlerArgs,
  restoreEnv,
  sanitizeEnv,
} from "./testUtil";

describe("handler()", () => {
  beforeEach(sanitizeEnv);
  afterEach(restoreEnv);

  it("throws by default because env vars are not provided", async () => {
    expect(handler(...generateHandlerArgs())).rejects.toThrow();
  });

  it("throws when pointing to a non-existing repository", async () => {
    process.env.GIT_REPO_URI = "https://example.com/non-existing-repo.git";
    process.env.GIT_FILE_PATH = "clicks.txt";
    expect(handler(...generateHandlerArgs())).rejects.toThrow();
  });

  it("throws when credentials are not configured", async () => {
    process.env.GIT_REPO_URI =
      "https://github.com/kachkaev/aws-iot-button-logger-to-git.git";
    process.env.GIT_FILE_PATH = "clicks.txt";
    expect(handler(...generateHandlerArgs())).rejects.toThrow();
  });

  it("throws for an empty repository (branch does not exist)", async () => {
    const { repositoryPath } = await createTemporaryRepository();
    process.env.GIT_REPO_URI = repositoryPath;
    process.env.GIT_FILE_PATH = "clicks.txt";
    expect(handler(...generateHandlerArgs())).rejects.toThrow();
  });

  [
    "../foo/bar",
    `..${path.sep}..${path.sep}foobar`,
    os.type() === "Windows_NT" ? "C:\\absolute\\path" : "/absolute/path",
  ].forEach((filePath) => {
    it(`throws when file path is malicious (${filePath})`, async () => {
      const { repositoryPath } = await createTemporaryRepository({
        filesByPath: {
          "README.md": "hello world",
        },
      });
      process.env.GIT_REPO_URI = repositoryPath;
      process.env.GIT_FILE_PATH = filePath;
      await expect(handler(...generateHandlerArgs())).rejects.toThrow();
    });
  });

  [
    "clicks.txt",
    "path/to/subfolder/file.txt",
    "~log.csv",
    "~/.ssh/id_rsa.pub",
  ].forEach((filePath) => {
    it(`works for a non-empty repository that does not contain the file to write (${filePath})`, async () => {
      const { repositoryPath, runGitCommand } = await createTemporaryRepository(
        {
          filesByPath: {
            "README.md": "hello world",
          },
        },
      );
      process.env.GIT_REPO_URI = repositoryPath;
      process.env.GIT_FILE_PATH = filePath;
      await handler(...generateHandlerArgs());
      await runGitCommand(["checkout", "master"]);
      const fileContents = await fs.readFile(
        path.resolve(repositoryPath, process.env.GIT_FILE_PATH),
        "utf8",
      );
      expect(fileContents).toMatch(
        /^\d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d \+0000 SINGLE\n$/,
      );
    });
  });

  it("works for a non-empty repository that already contains the file to write", async () => {
    const { repositoryPath, runGitCommand } = await createTemporaryRepository({
      filesByPath: {
        "README.md": "hello world",
        "clicks.txt": "pre-existing content\n",
      },
    });
    process.env.GIT_REPO_URI = repositoryPath;
    process.env.GIT_FILE_PATH = "clicks.txt";
    await handler(...generateHandlerArgs());
    await runGitCommand(["checkout", "master"]);
    const fileContents = await fs.readFile(
      path.resolve(repositoryPath, process.env.GIT_FILE_PATH),
      "utf8",
    );
    expect(fileContents).toMatch(
      /^pre-existing content\n\d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d \+0000 SINGLE\n$/,
    );
  });

  it("works for different click types", async () => {
    const { repositoryPath, runGitCommand } = await createTemporaryRepository({
      filesByPath: {
        "README.md": "hello world",
      },
    });
    process.env.GIT_REPO_URI = repositoryPath;
    process.env.GIT_FILE_PATH = "clicks.txt";
    await handler(...generateHandlerArgs());
    await handler(...generateHandlerArgs("DOUBLE"));
    await handler(...generateHandlerArgs("LONG"));
    await handler(...generateHandlerArgs("SINGLE"));
    process.env.EVENT_LABEL_FOR_SINGLE_CLICK = "A";
    process.env.EVENT_LABEL_FOR_DOUBLE_CLICK = "B";
    process.env.EVENT_LABEL_FOR_LONG_CLICK = "C";
    await handler(...generateHandlerArgs("SINGLE"));
    await handler(...generateHandlerArgs("DOUBLE"));
    await handler(...generateHandlerArgs("LONG"));
    await runGitCommand(["checkout", "master"]);
    const lines = (await fs.readFile(
      path.resolve(repositoryPath, process.env.GIT_FILE_PATH),
      "utf8",
    )).split("\n");
    expect(lines[0]).toMatch(/^[\d: -]+ \+0000 SINGLE$/);
    expect(lines[1]).toMatch(/^[\d: -]+ \+0000 DOUBLE$/);
    expect(lines[2]).toMatch(/^[\d: -]+ \+0000 LONG$/);
    expect(lines[3]).toMatch(/^[\d: -]+ \+0000 SINGLE$/);
    expect(lines[4]).toMatch(/^[\d: -]+ \+0000 A$/);
    expect(lines[5]).toMatch(/^[\d: -]+ \+0000 B$/);
    expect(lines[6]).toMatch(/^[\d: -]+ \+0000 C$/);
    expect(lines[7]).toMatch(/^$/);
  });

  it("works for different time zones and formats", async () => {
    const { repositoryPath, runGitCommand } = await createTemporaryRepository({
      filesByPath: {
        "README.md": "hello world",
      },
    });
    process.env.GIT_REPO_URI = repositoryPath;
    process.env.GIT_FILE_PATH = "clicks.txt";
    process.env.EVENT_TIME_ZONE = "UTC+3";
    await handler(...generateHandlerArgs());
    process.env.EVENT_TIME_FORMAT = "X,Z";
    process.env.EVENT_TIME_ZONE = "UTC";
    await handler(...generateHandlerArgs());
    process.env.EVENT_LINE_FORMAT = "%LABEL%,%TIME%\n";
    await handler(...generateHandlerArgs());
    await runGitCommand(["checkout", "master"]);
    const lines = (await fs.readFile(
      path.resolve(repositoryPath, process.env.GIT_FILE_PATH),
      "utf8",
    )).split("\n");
    expect(lines[0]).toMatch(
      /^\d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d \+0300 SINGLE$/,
    );
    expect(lines[1]).toMatch(/^\d{10},\+0 SINGLE$/);
    expect(lines[2]).toMatch(/^SINGLE,\d{10},\+0$/);
    expect(lines[3]).toMatch(/^$/);
  });
});
