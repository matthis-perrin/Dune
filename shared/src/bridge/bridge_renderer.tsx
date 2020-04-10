import {BridgeCommand, BridgeEvent} from '@shared/bridge/commands';
import {asMap, asString} from '@shared/type_utils';

const DEFAULT_COMMAND_TIMEOUT_MS = 10000;

const ALPHA_NUM_COUNT = 36;
const uniqueId = (prefix: string): string =>
  prefix + Math.random().toString(ALPHA_NUM_COUNT).substr(2).toUpperCase();

export class BridgeTransport {
  private readonly pendingCommands = new Map<
    string,
    {
      // tslint:disable-next-line:no-any
      resolve(response: any): void;
      // tslint:disable-next-line:no-any
      reject(err: any): void;
      timeout: number;
    }
  >();

  // tslint:disable-next-line:no-any
  constructor(private readonly eventHandler: (event: BridgeEvent, data: any) => void) {
    window.addEventListener(
      'message',
      event => {
        if (event.source !== window) {
          console.error(
            'Received "message" event with a source different than window: ',
            event.source
          );
          return;
        }
        this.handleMessage(event.data);
      },
      false
    );
  }

  public async sendBridgeCommand<T>(
    command: BridgeCommand,
    // tslint:disable-next-line:no-any
    data?: any,
    timeoutMs: number = DEFAULT_COMMAND_TIMEOUT_MS
  ): Promise<T> {
    // console.debug('BRIDGE', command, data);
    return new Promise<T>((resolve, reject) => {
      const id = uniqueId(`command-${command}`);
      const timeout = (setTimeout(() => {
        this.handleCommandTimingOut(id);
      }, timeoutMs) as unknown) as number;
      this.pendingCommands.set(id, {resolve, reject, timeout});
      const message = {id, command, data};
      window.postMessage({sender: 'web', data: JSON.stringify(message)}, '*');
    });
  }

  private handleCommandError(id: string, error: string): void {
    const pendingCommand = this.pendingCommands.get(id);
    if (!pendingCommand) {
      console.error(`Bridge command errored (${error}), but no pending command found (${id})`);
      return;
    }
    const {reject, timeout} = pendingCommand;
    clearTimeout(timeout);
    reject(error);
    this.pendingCommands.delete(id);
  }

  // tslint:disable-next-line:no-any
  private handleCommandResponse(id: string, response: any): void {
    const pendingCommand = this.pendingCommands.get(id);
    if (!pendingCommand) {
      console.error(
        `Bridge command successful (${response}), but no pending command found (${id})`
      );
      return;
    }
    const {resolve, timeout} = pendingCommand;
    clearTimeout(timeout);
    // console.debug('BRIDGE', id, response);
    resolve(response);
    this.pendingCommands.delete(id);
  }

  // tslint:disable-next-line:no-any
  private handleEvent(event: BridgeEvent, data: any): void {
    this.eventHandler(event, data);
  }

  private handleCommandTimingOut(id: string): void {
    this.handleCommandError(id, 'timeout');
  }

  // tslint:disable-next-line:no-any
  private handleMessage(msg: any): void {
    const {sender, data} = asMap(msg);
    if (sender !== 'preload') {
      return;
    }
    const bridgeMessage = asString(data, undefined);
    if (!bridgeMessage) {
      console.error(`Received invalid bridge response (non-string response): ${data}`);
      return;
    }
    try {
      const bridgeMessageJSON = asMap(JSON.parse(bridgeMessage));
      const id = asString(bridgeMessageJSON.id, undefined);
      const event = asString(bridgeMessageJSON.event, undefined);
      if (!id && !event) {
        console.error(
          `Received invalid bridge response (id is not a string): ${bridgeMessageJSON}`
        );
        return;
      }
      if (id) {
        const error = asString(bridgeMessageJSON.error, undefined);
        if (error) {
          this.handleCommandError(id, error);
          return;
        }
        this.handleCommandResponse(id, bridgeMessageJSON.response);
      } else if (event) {
        const eventData = bridgeMessageJSON.data;
        this.handleEvent(event as BridgeEvent, eventData);
      }
    } catch (err) {
      console.error(`Error while processing bridge message (invalid JSON?): ${data}`, err);
      return;
    }
  }
}
