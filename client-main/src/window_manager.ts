import {BrowserWindow, screen} from 'electron';

import {handleCommand} from '@root/bridge';

import {createBrowserWindow, setupBrowserWindow} from '@shared/electron/browser_window';
import {ClientAppInfo, ClientAppType} from '@shared/models';

interface WindowOptions {
  id: string;
  // Size of the window in pixels, if not specified, the window will be opened fullscreen
  size?: {
    width: number;
    height: number;
  };
}

interface WindowInfo {
  id: string;
  browserWindow: BrowserWindow;
  appInfo: ClientAppInfo;
}

const MAIN_APP_ID = 'main-app';

class WindowManager {
  private readonly windows: {[key: string]: WindowInfo} = {};

  public async openWindow(appInfo: ClientAppInfo): Promise<void> {
    const windowInfo = await this.openOrForegroundWindow(appInfo);
    windowInfo.browserWindow.on('close', () => {
      // Close all the other windows before closing the main window
      if (appInfo.type === ClientAppType.MainApp) {
        this.closeAllNoneMainWindows();
      }
      delete this.windows[windowInfo.id];
    });
  }

  public getAppInfo(windowId: string): ClientAppInfo | undefined {
    const windowInfo = this.windows[windowId];
    if (!windowInfo) {
      return undefined;
    }
    return windowInfo.appInfo;
  }

  private getWindowOptionsForAppInfo(appInfo: ClientAppInfo): WindowOptions {
    if (appInfo.type === ClientAppType.MainApp) {
      return {id: MAIN_APP_ID};
    }
    const listAppSize = {width: 1400, height: 1000};
    if (appInfo.type === ClientAppType.ListBobinesFillesApp) {
      return {id: 'list-bobines-filles-app', size: listAppSize};
    }
    if (appInfo.type === ClientAppType.ListBobinesMeresApp) {
      return {id: 'list-bobines-meres-app', size: listAppSize};
    }
    if (appInfo.type === ClientAppType.ListClichesApp) {
      return {id: 'list-cliches-app', size: listAppSize};
    }
    if (appInfo.type === ClientAppType.ListPerfosApp) {
      return {id: 'list-perfos-app', size: listAppSize};
    }
    if (appInfo.type === ClientAppType.ListRefentesApp) {
      return {id: 'list-refentes-app', size: listAppSize};
    }
    if (appInfo.type === ClientAppType.ListOperationsApp) {
      return {id: 'list-operations-app', size: listAppSize};
    }

    if (appInfo.type === ClientAppType.ViewOperationApp) {
      const {operationId = 'create'} = appInfo.data;
      return {id: `view-operation-app--${operationId}`, size: {width: 300, height: 600}};
    }

    return {id: 'unknown-app', size: {width: 400, height: 700}};
  }

  private getDefaultSize(): {width: number; height: number} {
    const padding = 16;
    const {width, height} = screen.getPrimaryDisplay().workAreaSize;
    return {width: width - 2 * padding, height: height - 2 * padding};
  }

  private closeAllNoneMainWindows() {
    Object.keys(this.windows)
      .filter(id => id !== MAIN_APP_ID)
      .forEach(id => {
        const window = this.windows[id];
        if (window) {
          window.browserWindow.close();
          delete this.windows[id];
        }
      });
  }

  private async openOrForegroundWindow(appInfo: ClientAppInfo): Promise<WindowInfo> {
    // If window already exists, just bring it to the foreground
    const {size, id} = this.getWindowOptionsForAppInfo(appInfo);
    let windowInfo = this.windows[id];
    if (windowInfo) {
      const {browserWindow} = windowInfo;
      if (browserWindow.isMinimized()) {
        browserWindow.show();
        browserWindow.restore();
      }
      browserWindow.focus();
      return Promise.resolve(windowInfo);
    }

    // Create the BrowserWindow, hidden at first.
    const sizeWithDefaults = size || this.getDefaultSize();
    const browserWindow = createBrowserWindow({
      ...sizeWithDefaults,
      show: false,
    });

    // Save the window in the manager
    windowInfo = {browserWindow, appInfo, id};
    this.windows[id] = windowInfo;

    // Setup the window, and show if once it's done.
    // tslint:disable-next-line: no-any
    try {
      await setupBrowserWindow(browserWindow, handleCommand, id);
      if (size === undefined) {
        browserWindow.maximize();
      }
      browserWindow.show();
      if (process.env.MODE === 'development') {
        browserWindow.webContents.openDevTools({mode: 'detach'});
      }
      return windowInfo;
    } catch (err) {
      // If something went wrong, close the window and remove it from the window manager
      if (!windowInfo.browserWindow.isDestroyed() && windowInfo.browserWindow.isClosable()) {
        windowInfo.browserWindow.close();
      }
      delete this.windows[id];
      return Promise.reject(err);
    }
  }
}

export const windowManager = new WindowManager();
