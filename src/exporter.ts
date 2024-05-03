import express from "express";

import { register, Gauge } from "prom-client";
import { getUnixTimestamp } from "./util.js";

let temperatureGaugeLastSeen: number = 0;

const temperatureGauge = new Gauge({
  name: "iot_air_temperature",
  help: "Gauge for air temperature",
  labelNames: ["identifier"],
});

export const setTemperatureGauge = (identifier: string, value: number) => {
  temperatureGaugeLastSeen = getUnixTimestamp();
  temperatureGauge.labels({ identifier }).set(value);
};

let humidityGaugeLastSeen: number = 0;

const humidityGauge = new Gauge({
  name: "iot_air_humidity",
  help: "Gauge for air humidity",
  labelNames: ["identifier"],
});

export const setHumidityGauge = (identifier: string, value: number) => {
  humidityGaugeLastSeen = getUnixTimestamp();
  humidityGauge.labels({ identifier }).set(value);
};

let pressureGaugeLastSeen: number = 0;

const pressureGauge = new Gauge({
  name: "iot_air_pressure",
  help: "Gauge for air pressure",
  labelNames: ["identifier"],
});

export const setPressureGauge = (identifier: string, value: number) => {
  pressureGaugeLastSeen = getUnixTimestamp();
  pressureGauge.labels({ identifier }).set(value);
};

export const cleanupGauges = () => {
  const timeout = 60;

  if (
    temperatureGaugeLastSeen &&
    temperatureGaugeLastSeen < getUnixTimestamp() - timeout
  ) {
    console.log("timeout temperature, reset");

    temperatureGauge.reset();

    temperatureGaugeLastSeen = 0;
  }

  if (
    humidityGaugeLastSeen &&
    humidityGaugeLastSeen < getUnixTimestamp() - timeout
  ) {
    console.log("timeout humidity, reset");

    humidityGauge.reset();

    humidityGaugeLastSeen = 0;
  }

  if (
    pressureGaugeLastSeen &&
    pressureGaugeLastSeen < getUnixTimestamp() - timeout
  ) {
    console.log("timeout pressure, reset");

    pressureGauge.reset();

    pressureGaugeLastSeen = 0;
  }
};

export const createExporterServer = () => {
  console.log("createExporterServer");

  const server = express();

  server.get("/metrics", async (req, res) => {
    try {
      res.set("Content-Type", register.contentType);
      res.end(await register.metrics());
    } catch (ex) {
      res.status(500).end(ex);
    }
  });

  server.listen(3000, () => {
    console.log("express listening 3000");
  });
};
