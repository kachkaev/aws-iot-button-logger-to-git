import { IotButtonClickType, Config } from "./types";
import { DateTime } from "luxon";
import fs from "fs-extra";
import os from "os";
import path from "path";
import execa from "execa";

export const appendToFileInRemoteGitRepository = async ({
  config,
  line,
}: {
  config: Pick<
    Config,
    | "GIT_REPO_URI"
    | "GIT_REPO_BRANCH"
    | "GIT_FILE_PATH"
    | "GIT_COMMIT_MESSAGE"
    | "GIT_COMMIT_TIME_ZONE"
    | "GIT_COMMIT_USER_NAME"
    | "GIT_COMMIT_USER_EMAIL"
  >;
  line: string;
}) => {
  const handlerDirectory = path.resolve(
    os.tmpdir(),
    `aws-iot-button-logger-to-git-${new Date().getTime()}`,
  );
  const repositoryDirectory = path.resolve(handlerDirectory, `repository`);
  const resolvedGitFilePath = path.resolve(
    repositoryDirectory,
    config.GIT_FILE_PATH,
  );

  // Guard against potentially malicious GIT_FILE_PATH
  if (
    path.relative(repositoryDirectory, resolvedGitFilePath).startsWith("..")
  ) {
    throw new Error("Provided GIT_FILE_PATH is outside the repository");
  }

  let gitPath: string = process.env.PATH;
  try {
    // Ensure git binary is available inside AWS Lambda
    if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
      await require("lambda-git")({
        targetDirectory: handlerDirectory,
        updateEnv: false,
      });
      gitPath = path.resolve(handlerDirectory, "usr/libexec/git-core");
    }

    // Make git commands easier to run
    const runGitCommand = async (args: string[]) => {
      await execa("git", args, {
        cwd: args[0] !== "clone" ? repositoryDirectory : undefined,
        // ...(args[0] !== "clone" && { cwd: repositoryDirectory }),
        env: {
          // Do not use global git config
          GIT_CONFIG: path.resolve(repositoryDirectory, ".git/config"),
          PATH: gitPath,
        },
        extendEnv: false,
      });
    };

    // Clone the repository from its origin
    await runGitCommand([
      "clone",
      "--branch",
      config.GIT_REPO_BRANCH,
      "--no-tags",
      "--depth",
      "1",
      config.GIT_REPO_URI,
      repositoryDirectory,
    ]);

    // Append line to file
    await fs.outputFile(resolvedGitFilePath, line, { flag: "a" });

    // Add file to index
    await runGitCommand(["add", config.GIT_FILE_PATH]);

    // Commit
    await runGitCommand([
      "commit",
      "--no-sign",
      "--no-verify",
      "--author",
      `${config.GIT_COMMIT_USER_NAME} <${config.GIT_COMMIT_USER_EMAIL}>`,
      "--date",
      DateTime.utc()
        .setZone(config.GIT_COMMIT_TIME_ZONE)
        .toISO(),
      "--message",
      config.GIT_COMMIT_MESSAGE,
    ]);

    // Push changes to the origin
    await runGitCommand(["push", "origin", config.GIT_REPO_BRANCH]);
  } finally {
    await fs.remove(handlerDirectory);
  }
};

export const generateLine = ({
  config,
  clickType,
}: {
  config: Pick<
    Config,
    | "EVENT_TIME_ZONE"
    | "EVENT_TIME_FORMAT"
    | "EVENT_LABEL_FOR_SINGLE_CLICK"
    | "EVENT_LABEL_FOR_DOUBLE_CLICK"
    | "EVENT_LABEL_FOR_LONG_CLICK"
    | "EVENT_LINE_FORMAT"
  >;
  clickType?: IotButtonClickType;
}) => {
  const time = DateTime.utc()
    .setZone(config.EVENT_TIME_ZONE)
    .toFormat(config.EVENT_TIME_FORMAT);

  let label;
  switch (clickType) {
    case "DOUBLE":
      label = config.EVENT_LABEL_FOR_DOUBLE_CLICK;
      break;
    case "LONG":
      label = config.EVENT_LABEL_FOR_LONG_CLICK;
      break;
    default:
      label = config.EVENT_LABEL_FOR_SINGLE_CLICK;
  }

  // prettier-ignore
  const line = config.EVENT_LINE_FORMAT
    .replace("%TIME%", time)
    .replace("%LABEL%", label);

  return line;
};
