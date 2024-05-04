import { createExporterServer } from "./exporter.js";
import { createIotServer } from "./iot.js";

// Duration sockets will be kept alive before timing out.
const iotServerTimeout = 1000 * 60 * 2;

const main = async () => {
  createIotServer({
    timeout: iotServerTimeout,
  });

  createExporterServer();
};

main();
