import { Server, Socket, createServer } from "node:net";
import EventEmitter from "node:events";
import { randomUUID } from "node:crypto";

export const IOT_STANDARD_ACTION_HI = "hi";
export const IOT_STANDARD_ACTION_PING = "ping";

export type IotOptions = {
  timeout: number;
};

export class IotSession {
  public initialised = false;

  public identifier?: string;

  public terminating = false;

  public socket: Socket;

  public uuid: string;

  private options: IotOptions;

  constructor(options: IotOptions, socket: Socket) {
    this.options = options;

    this.uuid = randomUUID();

    this.socket = socket;
    this.socket.setTimeout(this.options.timeout);
  }

  send = (payload: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      this.socket.write(payload, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  };

  end = (): Promise<void> => {
    return new Promise((resolve) => {
      this.terminating = true;

      this.socket.end(() => {
        resolve();
      });
    });
  };
}

export class IotServer extends EventEmitter<{
  "session-start": [IotSession];
  "session-event": [IotSession, string, string];
  "session-end": [IotSession];
}> {
  private server: Server;

  private pool: Array<IotSession> = [];

  private options: IotOptions;

  constructor(options: IotOptions) {
    super();

    this.options = options;

    this.server = createServer({
      noDelay: true,
    });

    this.server.on("connection", this.onServerConnection);
  }

  private onServerConnection = (socket: Socket) => {
    const session = new IotSession(this.options, socket);

    socket.on("data", (data) => this.onServerSocketData(session, data));
    socket.on("timeout", () => this.onServerSocketTimeout(session));
    socket.on("close", () => this.onServerSocketClose(session));
    socket.on("end", () => this.onServerSocketEnd(session));
    socket.on("error", (error) => this.onServerSocketError(session, error));

    this.pool.push(session);

    this.emit("session-start", session);
  };

  private onServerSocketData = (session: IotSession, data: Buffer) => {
    if (session.terminating) {
      console.log(
        `[IotServer/onServerSocketData] ${session.identifier} Received data on terminating socket.`
      );

      return;
    }

    const raw = data.toString("utf-8");
    const payload = /([a-z]{1,32})\:([a-zA-Z0-9._-]{1,512})\;/.exec(raw);

    if (!payload) {
      console.log(
        `[IotServer/onServerSocketData] ${session.identifier} Failed to parse data ${raw}.`
      );

      return;
    }

    const action = payload.at(1);
    const value = payload.at(2);

    if (!action || !value) {
      console.log(
        `[IotServer/onServerSocketData] ${session.identifier} Failed parse payload action ${action}, value ${value}.`
      );

      return;
    }

    if (!session.initialised) {
      if (action !== IOT_STANDARD_ACTION_HI) {
        console.log(
          `[IotServer/onServerSocketData] ${session.identifier} Received non-hi action on a non-initialised session. Terminating session.`
        );

        session.end().then(() => this.onServerSocketEnd(session));

        return;
      }

      session.initialised = true;
      session.identifier = value;
    }

    this.emit("session-event", session, action, value);
  };

  private onServerSocketTimeout = (session: IotSession) => {
    console.error(`[IotServer/onServerSocketTimeout] ${session.identifier}`);
    session.end().then(() => this.onServerSocketEnd(session));
  };

  private onServerSocketClose = (session: IotSession) => {
    console.error(`[IotServer/onServerSocketClose] ${session.identifier}`);
  };

  private onServerSocketEnd = (session: IotSession) => {
    console.error(`[IotServer/onServerSocketEnd] ${session.identifier}`);

    if (session.initialised) {
      this.emit("session-end", session);
    }

    this.deletePoolItem(session);
  };

  private onServerSocketError = (session: IotSession, err: Error) => {
    console.error(`[IotServer/onServerSocketError] ${session.identifier}`, err);
  };

  private deletePoolItem = (session: IotSession) => {
    const poolIndex = this.pool.findIndex(
      (poolSession) => poolSession.uuid === session.uuid
    );

    if (poolIndex >= 0) {
      this.pool.splice(poolIndex, 1);
    }
  };

  public listen = (port: number) => {
    console.log(`[IotServer/listen] Starting server listener on port ${port}.`);

    this.server.listen(port, () => {
      console.log(`[IotServer/listen] Listening on ${port}`);
    });
  };

  public broadcast = async (payload: string): Promise<void> => {
    await Promise.all(this.pool.map((session) => session.send(payload)));
  };
}
