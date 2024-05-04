import { createServer } from "node:net";
import {
  setHumidityGauge,
  setPressureGauge,
  setTemperatureGauge,
} from "./exporter.js";
import { getUnixTimestamp } from "./util.js";

const handleTemperature = (identifier: string, value: string) => {
  setTemperatureGauge(identifier, Number(value));
};

const handlePressure = (identifier: string, value: string) => {
  setPressureGauge(identifier, Number(value));
};

const handleHumidity = (identifier: string, value: string) => {
  setHumidityGauge(identifier, Number(value));
};

const handleEnd = (identifier: string) => {
  setTemperatureGauge(identifier, null);
  setPressureGauge(identifier, null);
  setHumidityGauge(identifier, null);
};

export const createIotServer = (opts: { timeout: number }) => {
  console.log("createIotServer");

  const server = createServer({
    noDelay: true,
    allowHalfOpen: false,
  });

  server.on("connection", (socket) => {
    socket.setTimeout(opts.timeout);

    console.log(`New connection from ${socket.remoteAddress}`);

    const sessionMetadata: {
      initialised: boolean;
      identifier: string;
      blocked: boolean;
      lastSeen: number;
    } = {
      initialised: false,
      identifier: "",
      blocked: false,
      lastSeen: getUnixTimestamp(),
    };

    const socketEndCallback = () => {
      console.log("ended connection", sessionMetadata.identifier);

      if (sessionMetadata.initialised) {
        handleEnd(sessionMetadata.identifier);
      }
    };

    const gracefulEnd = () => {
      socket.end(socketEndCallback);
      sessionMetadata.blocked = true;
    };

    const handleEvent = (action: string, value: string) => {
      if (sessionMetadata.blocked) {
        console.log("Event to blocked connection", action, value);

        return;
      }

      if (action === "hi") {
        console.log("action 'hi'", action, value);

        // action `hi` is a initial event only
        if (sessionMetadata.initialised) {
          console.log("Session has already been initialised");

          gracefulEnd();
          return;
        }

        sessionMetadata.initialised = true;
        sessionMetadata.identifier = value;
      }

      if (!sessionMetadata.initialised) {
        console.log("received event prematurely");

        // Premature payload
        gracefulEnd();
        return;
      }

      if (action === "temperature") {
        handleTemperature(sessionMetadata.identifier, value);
      }

      if (action === "pressure") {
        handlePressure(sessionMetadata.identifier, value);
      }

      if (action === "humidity") {
        handleHumidity(sessionMetadata.identifier, value);
      }
    };

    socket.on("data", (data) => {
      const raw = data.toString("utf-8");
      const payload = /([a-z]{1,32})\:([a-zA-Z0-9._-]{1,128})\;/.exec(raw);

      if (!payload) {
        console.log(`Failed to parse payload, ${raw}`);
        return;
      }

      const action = payload.at(1);
      const value = payload.at(2);

      if (!action || !value) {
        console.log(
          `Failed to parse payload, action ${action}, value ${value}`
        );
        return;
      }

      handleEvent(action, value);
    });

    socket.on("timeout", () => {
      console.log("timeout connection", sessionMetadata.identifier);

      gracefulEnd();
    });

    socket.on("close", () => {
      console.log("closed connection", sessionMetadata.identifier);
    });

    socket.on("end", socketEndCallback);

    socket.on("error", (err) => {
      console.error(sessionMetadata.identifier, err);
    });
  });

  server.listen(3001, () => {
    console.log("iot listening port 3001");
  });
};
