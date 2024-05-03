import { cleanupGauges, createExporterServer } from "./exporter.js";
import { createIotServer } from "./iot.js";

const main = async () => {
  createIotServer();

  createExporterServer();

  setInterval(cleanupGauges, 1000);
};

main();
