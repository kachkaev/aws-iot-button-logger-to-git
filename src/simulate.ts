import { handler } from "./handler";
import { Context } from "aws-lambda";
import { envValidators } from "./config";
import envalid from "envalid";
import { IotButtonClickType } from "./types";

const simulate = async () => {
  const { CLICK_TYPE } = envalid.cleanEnv(process.env, {
    ...envValidators,
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
    ({} as any) as Context,
    null,
  );
};

if ((process.mainModule || ({} as any)).filename === __filename) {
  simulate();
}

export default simulate;
