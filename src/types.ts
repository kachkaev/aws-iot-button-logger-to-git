export type Config = Readonly<{
  EVENT_LABEL_FOR_SINGLE_CLICK: string;
  EVENT_LABEL_FOR_DOUBLE_CLICK: string;
  EVENT_LABEL_FOR_LONG_CLICK: string;
  EVENT_LINE_FORMAT: string;
  EVENT_TIME_FORMAT: string;
  EVENT_TIME_ZONE: string;
  GIT_REPO_URI: string;
  GIT_REPO_BRANCH: string;
  GIT_FILE_PATH: string;
  GIT_COMMIT_USER_NAME: string;
  GIT_COMMIT_USER_EMAIL: string;
  GIT_COMMIT_MESSAGE: string;
  GIT_COMMIT_UTC_OFFSET: number;
}>;

export type IotButtonClickType = "SINGLE" | "DOUBLE" | "LONG";

export interface IotButtonClickEvent {
  batteryVoltage: string;
  clickType: IotButtonClickType;
  serialNumber: string;
  /** Set to true when triggering the event handler locally */
  useLocalDotEnv?: boolean;
}
