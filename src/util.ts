import { IotButtonClickType, Config } from "./types";
import { DateTime } from "luxon";
import fs from "fs-extra";

export const appendToFile = async ({
  filePath,
  line,
}: {
  filePath: string;
  line: string;
}) => {
  await fs.outputFile(filePath, line);
};

export const appendToFileInRemoteGitRepo = async ({
  line,
}: {
  config: Config;
  line: string;
}) => {
  console.log("Appending line", line);
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
