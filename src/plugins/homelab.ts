import { setLabFanSpeedGauge } from "~/exporter.js";
import { IotServer } from "~/iot.js";

const IDENTIFIER_HOMELAB = "homelab";
const IDENTIFIER_FAN_CONTROLLER = "lab-fan-controller";

const calculateFanSpeed = (temp: number) => {
  if (temp > 45) {
    return 100;
  }

  if (temp > 35) {
    return 80;
  }

  if (temp > 27) {
    return 50;
  }

  if (temp > 25) {
    return 40;
  }

  if (temp > 0) {
    return 20;
  }

  return 100;
};

export const registerPluginHomelab = (iotServer: IotServer) => {
  iotServer.on("session-event", async (session, action, value) => {
    if (session.identifier !== IDENTIFIER_HOMELAB) {
      return;
    }

    if (action !== "temperature") {
      return;
    }

    const fanSpeed = calculateFanSpeed(Number(value));

    console.log(
      `[homelab/registerPluginHomelab] session-event. Setting fan speed to ${fanSpeed}%`
    );

    await iotServer.broadcastToIdentifier(
      IDENTIFIER_FAN_CONTROLLER,
      "fan-speed",
      `${fanSpeed}`
    );

    setLabFanSpeedGauge(IDENTIFIER_FAN_CONTROLLER, fanSpeed);
  });

  iotServer.on("session-end", async (session) => {
    if (session.identifier !== IDENTIFIER_HOMELAB) {
      return;
    }

    const fanSpeed = 100;

    console.log(
      `[homelab/registerPluginHomelab] session-end. Setting speed to ${fanSpeed}%`
    );

    await iotServer.broadcastToIdentifier(
      IDENTIFIER_FAN_CONTROLLER,
      "fan-speed",
      `${fanSpeed}`
    );

    setLabFanSpeedGauge(IDENTIFIER_FAN_CONTROLLER, fanSpeed);
  });
};
