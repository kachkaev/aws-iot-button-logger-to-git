export type Config = Readonly<{
  EVENT_TIME_FORMAT: string;
  EVENT_TIME_ZONE: string;
  EVENT_LABEL_FOR_SINGLE_CLICK: string;
  EVENT_LABEL_FOR_DOUBLE_CLICK: string;
  EVENT_LABEL_FOR_LONG_CLICK: string;
  EVENT_LINE_FORMAT: string;

  GIT_REPO_URI: string;
  GIT_REPO_BRANCH: string;

  GIT_FILE_PATH: string;

  GIT_COMMIT_MESSAGE: string;
  GIT_COMMIT_TIME_ZONE: string;
  GIT_COMMIT_USER_NAME: string;
  GIT_COMMIT_USER_EMAIL: string;
}>;

export type IotButtonClickType = "SINGLE" | "DOUBLE" | "LONG";

export interface IotButtonClickEvent {
  batteryVoltage: string;
  clickType: IotButtonClickType;
  serialNumber: string;
}
