import { Handler } from "aws-lambda";
import { IotButtonClickEvent } from "./types";
import { getConfig } from "./config";
import { appendToFileInRemoteGitRepo, generateLine } from "./util";

export const handler: Handler<IotButtonClickEvent> = async (event) => {
  const config = getConfig({
    useLocalDotEnv: event.useLocalDotEnv,
  });

  const line = generateLine({
    config,
    clickType: event ? event.clickType : undefined,
  });

  await appendToFileInRemoteGitRepo({
    config,
    line,
  });
};
