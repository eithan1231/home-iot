import express from "express";

import { register, Gauge } from "prom-client";

const temperatureGauge = new Gauge({
  name: "iot_air_temperature",
  help: "Gauge for air temperature",
  labelNames: ["identifier"],
});

export const setTemperatureGauge = (
  identifier: string,
  value: number | null
) => {
  if (value === null) {
    temperatureGauge.remove({ identifier });
    return;
  }

  temperatureGauge.labels({ identifier }).set(value);
};

const humidityGauge = new Gauge({
  name: "iot_air_humidity",
  help: "Gauge for air humidity",
  labelNames: ["identifier"],
});

export const setHumidityGauge = (identifier: string, value: number | null) => {
  if (value === null) {
    humidityGauge.remove({ identifier });
    return;
  }

  humidityGauge.labels({ identifier }).set(value);
};

const pressureGauge = new Gauge({
  name: "iot_air_pressure",
  help: "Gauge for air pressure",
  labelNames: ["identifier"],
});

export const setPressureGauge = (identifier: string, value: number | null) => {
  if (value === null) {
    pressureGauge.remove({ identifier });
    return;
  }

  pressureGauge.labels({ identifier }).set(value);
};

const labFanSpeedGauge = new Gauge({
  name: "iot_lab_fan_speed",
  help: "Gauge for lab fan speed",
  labelNames: ["identifier"],
});

export const setLabFanSpeedGauge = (
  identifier: string,
  value: number | null
) => {
  if (value === null) {
    labFanSpeedGauge.remove({ identifier });
    return;
  }

  labFanSpeedGauge.labels({ identifier }).set(value);
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
