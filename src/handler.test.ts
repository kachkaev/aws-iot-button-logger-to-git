import { handler } from "./handler";
import { Context } from "aws-lambda";
import { IotButtonClickType, IotButtonClickEvent } from "./types";
import os from "os";
import path from "path";
import execa from "execa";
import fs from "fs-extra";

const generateHandlerArgs = (clickType: IotButtonClickType = "SINGLE") =>
  [
    {
      serialNumber: "xxx",
      batteryVoltage: "xxmV",
      clickType,
    },
    ({} as any) as Context,
    null,
  ] as [IotButtonClickEvent, Context, null];

const createTemporaryRepository = async ({
  filesByPath,
  branch: branch = "master",
}: {
  filesByPath?: { [filePath: string]: string };
  branch?: string;
} = {}): Promise<{
  repositoryPath: string;
  runGitCommand: (args: string[]) => Promise<void>;
}> => {
  const repositoryPath = path.resolve(
    os.tmpdir(),
    `test-repo-${new Date().getTime()}`,
  );

  await fs.mkdirp(repositoryPath);

  const runGitCommand = async (args: string[]) => {
    await execa("git", args, {
      cwd: repositoryPath,
      env: {
        GIT_CONFIG_NOSYSTEM: "true",
        GIT_AUTHOR_NAME: "Test",
        GIT_AUTHOR_EMAIL: "test@example.com",
        GIT_COMMITTER_NAME: "Test",
        GIT_COMMITTER_EMAIL: "test@example.com",
        GIT_TERMINAL_PROMPT: "false",
      },
    });
  };

  await runGitCommand(["init"]);
  await runGitCommand(["checkout", "-b", branch]);

  if (filesByPath) {
    Object.entries(filesByPath).forEach(([filePath, fileContents]) => {
      const resolvedFilePath = path.resolve(repositoryPath, filePath);
      fs.mkdirpSync(path.dirname(resolvedFilePath));
      fs.writeFileSync(resolvedFilePath, fileContents);
    });

    await runGitCommand(["add", "--all"]);
    await runGitCommand(["commit", "--message", "Initial commit"]);

    // Make it possible to later push to the branch without setting receive.denyCurrentBranch=ignore
    await runGitCommand(["checkout", "--orphan", "orphan-branch"]);
    await runGitCommand(["rm", "-rf", "."]);
  }

  return {
    repositoryPath,
    runGitCommand,
  };
};

describe("handler()", () => {
  let initialEnv: NodeJS.ProcessEnv;
  beforeEach(() => {
    initialEnv = process.env;
    process.env = { ...initialEnv };
  });

  afterEach(() => {
    process.env = initialEnv;
  });

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
});
