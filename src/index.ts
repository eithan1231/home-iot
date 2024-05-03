import { createExporterServer } from "./exporter.js";
import { createIotServer } from "./iot.js";

const main = async () => {
  createIotServer();

  createExporterServer();
};

main();
