import {
  createExporterServer,
  setHumidityGauge,
  setPressureGauge,
  setTemperatureGauge,
} from "./exporter.js";
import { IotServer } from "./iot.js";

// Duration sockets will be kept alive before timing out.
const iotServerTimeout = 1000 * 60 * 2;

const main = async () => {
  const iotServer = new IotServer({
    timeout: iotServerTimeout,
  });

  iotServer.on("session-start", (session) => {
    //
  });

  iotServer.on("session-event", (session, action, value) => {
    if (!session.identifier) {
      throw new Error("Expecting identifier on session-event");
    }

    if (action === "temperature") {
      setTemperatureGauge(session.identifier, Number(value));
    }

    if (action === "humidity") {
      setHumidityGauge(session.identifier, Number(value));
    }

    if (action === "pressure") {
      setPressureGauge(session.identifier, Number(value));
    }
  });

  iotServer.on("session-end", (session) => {
    if (session.identifier) {
      setTemperatureGauge(session.identifier, null);
      setHumidityGauge(session.identifier, null);
      setPressureGauge(session.identifier, null);
    }
  });

  createExporterServer();
};

main();
