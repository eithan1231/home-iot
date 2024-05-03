import { createServer } from "node:net";
import {
  setHumidityGauge,
  setPressureGauge,
  setTemperatureGauge,
} from "./exporter.js";

const handleTemperature = (identifier: string, value: string) => {
  setTemperatureGauge(identifier, Number(value));
};

const handlePressure = (identifier: string, value: string) => {
  setPressureGauge(identifier, Number(value));
};

const handleHumidity = (identifier: string, value: string) => {
  setHumidityGauge(identifier, Number(value));
};

export const createIotServer = () => {
  console.log("createIotServer");

  const server = createServer();

  server.on("connection", (socket) => {
    console.log(`New connection from ${socket.remoteAddress}`);

    let identifier = "";
    let initialised = false;
    let blocked = false;

    const handleEvent = (action: string, value: string) => {
      if (blocked) {
        console.log("Event to blocked connection", action, value);

        return;
      }

      if (action === "hi") {
        console.log("action 'hi'", action, value);

        // action `hi` is a initial event only
        if (identifier) {
          console.log("action hi has already been sent on socket");

          socket.end();
          blocked = true;
          return;
        }

        initialised = true;

        identifier = value;
      }

      if (!initialised) {
        console.log("received event prematurely");

        // Premature payload
        socket.end();
        blocked = true;
        return;
      }

      if (action === "temperature") {
        handleTemperature(identifier, value);
      }

      if (action === "pressure") {
        handlePressure(identifier, value);
      }

      if (action === "humidity") {
        handleHumidity(identifier, value);
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

    socket.on("close", () => {
      console.log("closed connection", identifier);
    });

    socket.on("end", () => {
      console.log("ended connection", identifier);
    });

    socket.on("error", (err) => {
      console.error(identifier, err);
    });
  });

  server.listen(3001, () => {
    console.log("iot listening port 3001");
  });
};
