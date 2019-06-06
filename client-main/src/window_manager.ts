import {BrowserWindow, screen} from 'electron';

import {handleCommand} from '@root/bridge';
import {planProductionStore} from '@root/store';

import {sendBridgeEvent} from '@shared/bridge/bridge_main';
import {PlanProductionChanged} from '@shared/bridge/commands';
import {createBrowserWindow, setupBrowserWindow} from '@shared/electron/browser_window';
import {ClientAppInfo, ClientAppType} from '@shared/models';
import {asMap} from '@shared/type_utils';

interface WindowOptions {
  id: string;
  // Size of the window in pixels, if not specified, the window will be opened fullscreen
  size: {
    width?: number;
    height?: number;
  };
}

interface WindowInfo {
  id: string;
  browserWindow: BrowserWindow;
  appInfo: ClientAppInfo;
}

const MAIN_APP_ID = 'main-app';

class WindowManager {
  private readonly windows = new Map<string, WindowInfo>();

  public constructor() {
    planProductionStore.addListener(this.handlePlanProductionChanged, false);
  }

  public async openWindow(appInfo: ClientAppInfo): Promise<void> {
    const windowInfo = await this.openOrForegroundWindow(appInfo);
    windowInfo.browserWindow.on('close', () => {
      // Close all the other windows before closing the main window
      if (appInfo.type === ClientAppType.MainApp) {
        this.closeAllNoneMainWindows();
      }
      this.windows.delete(windowInfo.id);
    });
  }

  public closeWindow(windowId: string): void {
    const windowInfo = this.windows.get(windowId);
    if (!windowInfo) {
      return;
    }
    if (!windowInfo.browserWindow.isDestroyed() && windowInfo.browserWindow.isClosable()) {
      windowInfo.browserWindow.close();
    }
    this.windows.delete(windowId);
  }

  public getAppInfo(windowId: string): ClientAppInfo | undefined {
    const windowInfo = this.windows.get(windowId);
    if (!windowInfo) {
      return undefined;
    }
    return windowInfo.appInfo;
  }

  private readonly handlePlanProductionChanged = () => {
    Array.from(this.windows.values()).forEach(w =>
      sendBridgeEvent(w.browserWindow, PlanProductionChanged, undefined)
    );
  };

  private getWindowOptionsForAppInfo(appInfo: ClientAppInfo): WindowOptions {
    if (appInfo.type === ClientAppType.MainApp) {
      return {id: MAIN_APP_ID, size: {}};
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
      const {operationId = 'create'} = asMap(appInfo.data);
      return {id: `view-operation-app--${operationId}`, size: {width: 535, height: 250}};
    }

    if (appInfo.type === ClientAppType.PlanProductionEditorApp) {
      return {id: 'plan-production-editor-app', size: {width: 1200, height: 900}};
    }
    if (appInfo.type === ClientAppType.RefentePickerApp) {
      return {id: 'refente-picker-app', size: {width: 700}};
    }
    if (appInfo.type === ClientAppType.PerfoPickerApp) {
      return {id: 'perfo-picker-app', size: {width: 1150, height: 750}};
    }
    if (appInfo.type === ClientAppType.PapierPickerApp) {
      return {id: 'papier-picker-app', size: {width: 1200, height: 800}};
    }
    if (appInfo.type === ClientAppType.PolyproPickerApp) {
      return {id: 'polypro-picker-app', size: {width: 1200, height: 800}};
    }

    return {id: 'unknown-app', size: {width: 400, height: 700}};
  }

  private getDefaultSize(): {width: number; height: number} {
    const padding = 16;
    const {width, height} = screen.getPrimaryDisplay().workAreaSize;
    return {width: width - 2 * padding, height: height - 2 * padding};
  }

  private closeAllNoneMainWindows(): void {
    Array.from(this.windows.keys())
      .filter(id => id !== MAIN_APP_ID)
      .forEach(id => this.closeWindow(id));
  }

  private async openOrForegroundWindow(appInfo: ClientAppInfo): Promise<WindowInfo> {
    // If window already exists, just bring it to the foreground
    const {size, id} = this.getWindowOptionsForAppInfo(appInfo);
    let windowInfo = this.windows.get(id);
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
    const defaultSize = this.getDefaultSize();
    const {width = defaultSize.width, height = defaultSize.height} = size;
    const newBrowserWindow = createBrowserWindow({
      width,
      height,
      show: false,
    });
    if (process.env.MODE === 'development') {
      newBrowserWindow.webContents.openDevTools({mode: 'detach'});
    }

    // Save the window in the manager
    windowInfo = {browserWindow: newBrowserWindow, appInfo, id};
    this.windows.set(id, windowInfo);

    // Setup the window, and show if once it's done.
    // tslint:disable-next-line: no-any
    try {
      await setupBrowserWindow(newBrowserWindow, handleCommand, id);
      if (size === undefined) {
        newBrowserWindow.maximize();
      }
      newBrowserWindow.show();
      return windowInfo;
    } catch (err) {
      // If something went wrong, close the window and remove it from the window manager
      this.closeWindow(id);
      return Promise.reject(err);
    }
  }
}

export const windowManager = new WindowManager();
