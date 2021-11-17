import { Context } from "aws-lambda";
import execa from "execa";
import fs from "fs-extra";
import path from "path";
import { IotButtonClickType, IotButtonClickEvent } from "./types";
import { generateUniqueTempDirPath } from "./helpers";

let defaultEnv: NodeJS.ProcessEnv = { ...process.env };
export const sanitizeEnv = () => {
  const {
    EVENT_TIME_FORMAT,
    EVENT_TIME_ZONE,
    EVENT_LABEL_FOR_SINGLE_CLICK,
    EVENT_LABEL_FOR_DOUBLE_CLICK,
    EVENT_LABEL_FOR_LONG_CLICK,
    EVENT_LINE_FORMAT,
    GIT_REPO_URI,
    GIT_REPO_BRANCH,
    GIT_FILE_PATH,
    GIT_COMMIT_MESSAGE,
    GIT_COMMIT_TIME_ZONE,
    GIT_COMMIT_USER_NAME,
    GIT_COMMIT_USER_EMAIL,
    ...sanitizedEnv
  } = process.env;
  process.env = sanitizedEnv;
};
export const restoreEnv = () => {
  process.env = defaultEnv;
};

export const generateHandlerArgs = (clickType: IotButtonClickType = "SINGLE") =>
  [
    {
      serialNumber: "xxx",
      batteryVoltage: "xxmV",
      clickType,
    },
    {} as Context,
    null,
  ] as [IotButtonClickEvent, Context, null];

export const createTemporaryRepository = async ({
  filesByPath,
  branch: branch = "main",
}: {
  filesByPath?: { [filePath: string]: string };
  branch?: string;
} = {}): Promise<{
  repositoryPath: string;
  runGitCommand: (args: string[]) => Promise<void>;
}> => {
  const repositoryPath = generateUniqueTempDirPath("test-repository");

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
