import { Handler } from "aws-lambda";
import envalid from "envalid";

// Inspired by https://stackoverflow.com/a/32638352/1818285
// and https://dev.to/terrierscript/build-aws-lambda-function-with-typescript-only-use-parcel-bundler-426a

export type IotButtonClickType = "SINGLE" | "DOUBLE" | "LONG";

export interface IotButtonClickEvent {
  batteryVoltage: string;
  clickType: IotButtonClickType;
  serialNumber: string;
}

export const handler: Handler<IotButtonClickEvent> = async (event) => {
  const env = envalid.cleanEnv(
    process.env,
    {
      GIT_REPO_URI: envalid.str({ desc: "Git repository URI" }),
    },
    {
      strict: true,
      reporter: ({ errors }) => {
        const errorKeys = Object.keys(errors);
        if (!errorKeys.length) {
          return;
        }
        throw new Error("Invalid env vars: " + errorKeys);
      },
    },
  );
  const clickType: string = (event && event.clickType) || "";
};
