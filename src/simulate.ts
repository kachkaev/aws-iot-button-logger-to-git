import { handler } from "./handler";
import { Context } from "aws-lambda";
import * as envalid from "envalid";
import { IotButtonClickType } from "./types";
import { autoStartCommandIfNeeded } from "@kachkaev/commands";
import dotenv from "dotenv";

const simulate = async () => {
  if (process.env.NODE_ENV !== "test") {
    dotenv.config();
  }

  const { CLICK_TYPE } = envalid.cleanEnv(process.env, {
    CLICK_TYPE: envalid.str({
      desc: "Simulated click type",
      choices: ["SINGLE", "DOUBLE", "LONG"],
      default: "SINGLE",
    }),
  });

  await handler(
    {
      serialNumber: "xxx",
      batteryVoltage: "xxmV",
      clickType: CLICK_TYPE as IotButtonClickType,
    },
    {} as Context,
    null,
  );
};

autoStartCommandIfNeeded(simulate, __filename);

export default simulate;
