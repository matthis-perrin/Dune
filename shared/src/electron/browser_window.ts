import {app, BrowserWindow, BrowserWindowConstructorOptions} from 'electron';
import path from 'path';

import {BridgeCommandHandler, setupBridge} from '@shared/bridge/bridge_main';
import {asString} from '@shared/type_utils';

const SECURITY_SETTINGS = {
  allowRunningInsecureContent: false,
  contextIsolation: true,
  enableRemoteModule: false,
  nodeIntegration: false,
  nodeIntegrationInSubFrames: false,
  nodeIntegrationInWorker: false,
  sandbox: true,
  webSecurity: true,
};

const appPath = path.resolve(app.getAppPath());
const preloadScriptPath = path.join(appPath, asString(process.env.PRELOAD_SCRIPT_PATH, ''));
const rendererIndexPath = path.join(appPath, asString(process.env.RENDERER_INDEX_PATH, ''));

export function createBrowserWindow(options: BrowserWindowConstructorOptions = {}): BrowserWindow {
  const optionsWithSecurity = {
    ...options,
    webPreferences: {
      ...options.webPreferences,
      preload: preloadScriptPath,
      ...SECURITY_SETTINGS,
    },
  };
  return new BrowserWindow(optionsWithSecurity);
}

export async function setupBrowserWindow(
  browserWindow: BrowserWindow,
  handleCommand: BridgeCommandHandler,
  windowId?: string
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const rendererIndexPathWithParams = windowId
      ? `${rendererIndexPath}?id=${windowId}`
      : rendererIndexPath;
    // tslint:disable-next-line:no-null-keyword
    browserWindow.setMenu(null);
    setupBridge(browserWindow, handleCommand);
    browserWindow.webContents.on('did-finish-load', () => {
      resolve();
    });
    browserWindow.loadURL(`file://${rendererIndexPathWithParams}`).catch(err => {
      browserWindow.close();
      reject(err);
    });
  });
}
