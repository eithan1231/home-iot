import express from "express";

import { register, Gauge } from "prom-client";

export const temperatureGauge = new Gauge({
  name: "iot_air_temperature",
  help: "Gauge for air temperature",
  labelNames: ["identifier"],
});

export const humidityGauge = new Gauge({
  name: "iot_air_humidity",
  help: "Gauge for air humidity",
  labelNames: ["identifier"],
});

export const pressureGauge = new Gauge({
  name: "iot_air_pressure",
  help: "Gauge for air pressure",
  labelNames: ["identifier"],
});

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
