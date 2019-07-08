import {BrowserWindow} from 'electron';
import log from 'electron-log';

import {BridgeCommand, BridgeEvent} from '@shared/bridge/commands';
import {asFunction, asMap, asString} from '@shared/type_utils';

// tslint:disable-next-line:no-any
function sendResponse(browserWindow: BrowserWindow, id: string, response: any): void {
  sendMessage(browserWindow, JSON.stringify({id, response}));
}

function sendError(browserWindow: BrowserWindow, id: string, error: string | undefined): void {
  sendMessage(browserWindow, JSON.stringify({id, error}));
}

function sendMessage(browserWindow: BrowserWindow, message: string): void {
  if (!browserWindow.isDestroyed()) {
    browserWindow.webContents.send('bridge-message', message);
  }
}

// tslint:disable-next-line:no-any
export type BridgeCommandHandler = (
  browserWindow: BrowserWindow,
  command: BridgeCommand,
  data: any
) => Promise<any>;

// tslint:disable-next-line:no-any
export function sendBridgeEvent(browserWindow: BrowserWindow, event: BridgeEvent, data: any): void {
  sendMessage(browserWindow, JSON.stringify({event, data}));
}

export function setupBridge(
  browserWindow: BrowserWindow,
  handleCommand: BridgeCommandHandler
): void {
  browserWindow.webContents.on('ipc-message', (event, channel, data) => {
    if (channel === 'bridge-message') {
      const msg = asString(data, undefined);
      if (!msg) {
        log.error(`Received invalid bridge message (non-string message): ${data}`);
        return;
      }
      try {
        const msgJSON = asMap(JSON.parse(msg));
        const id = asString(msgJSON.id, undefined);
        if (!id) {
          log.error(`Received invalid bridge message (id is not a string): ${msgJSON}`);
          return;
        }
        const command = asString(msgJSON.command, undefined) as BridgeCommand;
        if (!command) {
          sendError(browserWindow, id, 'Invalid message command');
          return;
        }
        handleCommand(browserWindow, command, msgJSON.data)
          .then(result => sendResponse(browserWindow, id, result))
          .catch(err => {
            let errorString = asString(err, undefined);
            if (!errorString) {
              const errorObject = asMap(err);
              const errorToString = asFunction<() => string | undefined>(
                errorObject.toString,
                () => undefined
              );
              errorString = errorToString ? errorObject.toString() : String(err);
            }
            sendError(browserWindow, id, errorString);
          });
      } catch {
        log.error(`Received invalid bridge message (message is not a valid JSON): ${data}`);
        return;
      }
    } else {
      log.error('Received IPC message on the wrong channel');
    }
  });
}
