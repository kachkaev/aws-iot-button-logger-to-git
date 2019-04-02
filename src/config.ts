import envalid from "envalid";
import { Config } from "./types";

export const envValidators = {
  EVENT_TIME_FORMAT: envalid.str({
    desc:
      "Time format to use when logging events. Available tokens can be found in https://moment.github.io/luxon/docs/manual/formatting.html#table-of-tokens.",
    docs:
      "https://moment.github.io/luxon/docs/manual/formatting.html#table-of-tokens",
    default: "yyyy-MM-dd HH:mm:ss ZZZ",
  }),
  EVENT_TIME_ZONE: envalid.str({
    desc: "Time zone to use when logging events (IANA / fixed offset)",
    docs:
      "https://moment.github.io/luxon/docs/manual/zones.html#specifying-a-zone",
    example: "Europe/London",
    default: "UTC",
  }),
  EVENT_LABEL_FOR_SINGLE_CLICK: envalid.str({
    desc: "Event label to log when the button is pressed once",
    default: "SINGLE",
  }),
  EVENT_LABEL_FOR_DOUBLE_CLICK: envalid.str({
    desc: "Event label to log when the button is pressed twice",
    default: "DOUBLE",
  }),
  EVENT_LABEL_FOR_LONG_CLICK: envalid.str({
    desc: "Event label to log when the button is long-pressed",
    default: "LONG",
  }),
  EVENT_LINE_FORMAT: envalid.str({
    desc:
      "Line format to use (must include line ending). Unescaped \\n and \\r are converted to newline symbols.",
    default: "%TIME% %LABEL%\n",
  }),

  GIT_REPO_URI: envalid.str({
    desc:
      "Git repository URI (must include authentication). HTTPS only, SSH is not supported.",
    example: "https://username:token@github.com/example/my-data.git",
  }),
  GIT_REPO_BRANCH: envalid.str({
    desc: "Branch to change (must exist before the ",
    default: "master",
  }),

  GIT_FILE_PATH: envalid.str({
    desc:
      "Path to the log file inside the git repository. Make sure the path is not ignored via the .gitignore file.",
    example: "path/to/clicks.txt",
  }),

  GIT_COMMIT_MESSAGE: envalid.str({
    desc: "Description of the new commit",
    default: "Log IoT button click",
  }),
  GIT_COMMIT_TIME_ZONE: envalid.str({
    desc: "Time zone to use when committing",
    default: "UTC",
  }),
  GIT_COMMIT_USER_NAME: envalid.str({
    desc: "Name associated with the new commit",
    default: "IoT Button click handler",
  }),
  GIT_COMMIT_USER_EMAIL: envalid.str({
    desc: "Email associated with the new commit",
    default: "https://github.com/kachkaev/aws-iot-button-logger-to-git",
  }),
};

export const getConfig = ({ useLocalDotEnv = false }): Config => {
  const config = envalid.cleanEnv(process.env, envValidators, {
    strict: true,
    ...(!useLocalDotEnv && { dotEnvPath: null }),
    reporter: ({ errors }) => {
      const errorKeys = Object.keys(errors);
      if (!errorKeys.length) {
        return;
      }
      throw new Error("Invalid env vars: " + errorKeys);
    },
  });

  return config;
};
