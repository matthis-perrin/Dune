import child_process from 'child_process';
import {BrowserWindow, dialog, screen, shell, app} from 'electron';
import fs from 'fs';
import path from 'path';

import {handleCommand} from '@root/bridge';
import {getConfig} from '@root/config';
import {planProductionStore} from '@root/plan_production_store';

import {sendBridgeEvent} from '@shared/bridge/bridge_main';
import {PlanProductionChanged} from '@shared/bridge/commands';
import {createBrowserWindow, setupBrowserWindow} from '@shared/electron/browser_window';
import {ClientAppInfo, ClientAppType, Config} from '@shared/models';
import {asMap, asNumber, asBoolean} from '@shared/type_utils';

interface WindowOptions {
  id: string;
  // Size of the window in pixels, if not specified, the window will be opened fullscreen
  size: {
    width?: number;
    minWidth?: number;
    height?: number;
    minHeight?: number;
  };
  closable?: boolean;
  forPrinting?: boolean;
}

interface WindowInfo {
  id: string;
  browserWindow: BrowserWindow;
  appInfo: ClientAppInfo;
}

const MAIN_APP_ID = 'main-app';
const PLAN_PROD_EDITOR_APP_ID = (id: number) => `plan-production-editor-app--${id}`;
const BOBINES_PICKER_APP_ID = (id: number) => `bobines-picker-app--${id}`;
const REFENTE_PICKER_APP_ID = (id: number) => `refente-picker-app--${id}`;
const PERFO_PICKER_APP_ID = (id: number) => `perfo-picker-app--${id}`;
const PAPIER_PICKER_APP_ID = (id: number) => `papier-picker-app--${id}`;
const POLYPRO_PICKER_APP_ID = (id: number) => `polypro-picker-app--${id}`;

const PICKER_APP_IDS = [
  BOBINES_PICKER_APP_ID,
  REFENTE_PICKER_APP_ID,
  PERFO_PICKER_APP_ID,
  PAPIER_PICKER_APP_ID,
  POLYPRO_PICKER_APP_ID,
];

class WindowManager {
  private readonly windows = new Map<string, WindowInfo>();

  public constructor() {
    planProductionStore.setListener(this.handlePlanProductionChanged);
  }

  public async openWindow(appInfo: ClientAppInfo): Promise<WindowInfo> {
    if (appInfo.type === ClientAppType.PlanProductionEditorApp) {
      const {id, isCreating} = asMap(appInfo.data);
      if (!asBoolean(isCreating)) {
        await planProductionStore.openPlan(asNumber(id, 0));
      }
    }

    const windowInfo = await this.openOrForegroundWindow(appInfo);

    windowInfo.browserWindow.on('close', () => {
      // Close all the other windows before closing the main window
      if (windowInfo.id === MAIN_APP_ID) {
        this.closeAllNoneMainWindows();
      } else if (windowInfo.appInfo.type === ClientAppType.PlanProductionEditorApp) {
        const {id} = asMap(windowInfo.appInfo.data);
        const planId = asNumber(id, 0);
        PICKER_APP_IDS.forEach(pickerAppId => this.closeWindow(pickerAppId(planId)));
        planProductionStore.closePlan(planId);
      } else if (windowInfo.appInfo.type === ClientAppType.ProductionApp) {
        this.closeWindowOfType(ClientAppType.StopApp);
      }
      this.windows.delete(windowInfo.id);
    });

    return windowInfo;
  }

  public closeWindow(windowId: string): void {
    const windowInfo = this.windows.get(windowId);
    if (!windowInfo) {
      return;
    }
    if (!windowInfo.browserWindow.isDestroyed()) {
      if (!windowInfo.browserWindow.isClosable()) {
        windowInfo.browserWindow.setClosable(true);
      }
      windowInfo.browserWindow.close();
    }
    this.windows.delete(windowId);
  }

  public async saveAsPDF(
    windowInfo: WindowInfo,
    filePath: string,
    failSafe: boolean = false
  ): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      windowInfo.browserWindow.webContents.printToPDF(
        {
          marginsType: 0, // default margin
          pageSize: 'A4',
          printBackground: true,
          printSelectionOnly: false,
          landscape: false,
        },
        (printError, data) => {
          if (printError) {
            console.log(printError);
            reject(printError);
            return;
          }
          fs.writeFile(filePath, data, saveError => {
            if (saveError) {
              if (failSafe) {
                resolve(data);
              } else {
                reject(saveError);
              }
              return;
            }
            resolve(data);
          });
        }
      );
    });
  }

  public async printAsPDF(windowId: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const windowInfo = this.windows.get(windowId);
      if (!windowInfo) {
        reject();
        return;
      }

      const tempFileName = `for_printing_${Date.now()}.pdf`;
      const tempFilePath = path.join(app.getPath('temp'), tempFileName);
      this.saveAsPDF(windowInfo, tempFilePath)
        .then(() => {
          const AdobeReaderPath = path.join(
            'C:',
            'Program Files (x86)',
            'Adobe',
            'Acrobat Reader DC',
            'Reader',
            'AcroRd32.exe'
          );
          const cmd = `"${AdobeReaderPath}" /p ${tempFilePath}`;
          child_process.exec(cmd, error => {
            if (error) {
              reject(error.message);
              return;
            }
            resolve();
          });
        })
        .catch(reject);
    });
  }

  public async saveToPDF(windowId: string, title: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const windowInfo = this.windows.get(windowId);
      if (!windowInfo) {
        reject();
        return;
      }
      dialog.showSaveDialog(
        windowInfo.browserWindow,
        {defaultPath: title, filters: [{extensions: ['pdf'], name: 'PDF'}]},
        filename => {
          if (!filename) {
            resolve();
            return;
          }
          this.saveAsPDF(windowInfo, filename)
            .then(() => {
              if (shell.openItem(filename)) {
                resolve();
                return;
              }
              reject();
            })
            .catch(reject);
        }
      );
    });
  }

  public closeWindowOfType(type: ClientAppType): void {
    for (const w of this.windows.values()) {
      if (w.appInfo.type === type) {
        this.closeWindow(w.id);
      }
    }
  }

  public getAppInfo(windowId: string): (ClientAppInfo & {config: Config}) | undefined {
    const windowInfo = this.windows.get(windowId);
    if (!windowInfo) {
      return undefined;
    }
    return {...windowInfo.appInfo, config: getConfig()};
  }

  private readonly handlePlanProductionChanged = (id: number) => {
    Array.from(this.windows.values()).forEach(w =>
      sendBridgeEvent(w.browserWindow, PlanProductionChanged, {id})
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
    if (appInfo.type === ClientAppType.ListPapiersApp) {
      return {id: 'list-papiers-app', size: listAppSize};
    }
    if (appInfo.type === ClientAppType.ListPolyprosApp) {
      return {id: 'list-polypros-app', size: listAppSize};
    }
    if (appInfo.type === ClientAppType.ListClichesApp) {
      return {id: 'list-cliches-app', size: listAppSize};
    }
    if (appInfo.type === ClientAppType.ViewBobineApp) {
      const {bobineRef = ''} = asMap(appInfo.data);
      return {id: `view-bobine-app--${bobineRef}`, size: {width: 1300, height: 750}};
    }
    if (appInfo.type === ClientAppType.PlanProductionEditorApp) {
      const {id} = asMap(appInfo.data);
      return {id: PLAN_PROD_EDITOR_APP_ID(asNumber(id, 0)), size: {width: 1250, minWidth: 1050}};
    }
    if (appInfo.type === ClientAppType.BobinesPickerApp) {
      const {id} = asMap(appInfo.data);
      return {id: BOBINES_PICKER_APP_ID(asNumber(id, 0)), size: {width: 1550, height: 800}};
    }
    if (appInfo.type === ClientAppType.RefentePickerApp) {
      const {id} = asMap(appInfo.data);
      return {id: REFENTE_PICKER_APP_ID(asNumber(id, 0)), size: {width: 700, height: 800}};
    }
    if (appInfo.type === ClientAppType.PerfoPickerApp) {
      const {id} = asMap(appInfo.data);
      return {id: PERFO_PICKER_APP_ID(asNumber(id, 0)), size: {width: 1150, height: 750}};
    }
    if (appInfo.type === ClientAppType.PapierPickerApp) {
      const {id} = asMap(appInfo.data);
      return {id: PAPIER_PICKER_APP_ID(asNumber(id, 0)), size: {width: 1000, height: 800}};
    }
    if (appInfo.type === ClientAppType.PolyproPickerApp) {
      const {id} = asMap(appInfo.data);
      return {id: POLYPRO_PICKER_APP_ID(asNumber(id, 0)), size: {width: 1000, height: 450}};
    }
    if (appInfo.type === ClientAppType.ViewDayApp) {
      return {id: `view-day-app--${Date.now()}`, size: {}};
    }
    if (appInfo.type === ClientAppType.ProductionApp) {
      return {id: 'production', size: {}};
    }
    if (appInfo.type === ClientAppType.StopApp) {
      const {day, stopStart} = asMap(appInfo.data);
      return {id: `stop-${day}-${stopStart}`, size: {width: 1200}};
    }
    if (appInfo.type === ClientAppType.StatisticsApp) {
      return {id: 'statistics', size: {}};
    }
    if (appInfo.type === ClientAppType.GiaveProductionApp) {
      return {id: 'GIAVE', size: {}};
    }
    if (appInfo.type === ClientAppType.ReportsApp) {
      return {id: 'reports', size: {}};
    }
    if (appInfo.type === ClientAppType.ReportsPrinterApp) {
      return {id: 'reports-printer', size: {width: 1200}, forPrinting: true};
    }
    if (appInfo.type === ClientAppType.PlanProdPrinterApp) {
      return {id: 'plan-prod-printer', size: {width: 1100}, forPrinting: true};
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
    const {size, id, closable, forPrinting} = this.getWindowOptionsForAppInfo(appInfo);
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
    const {width = defaultSize.width, height = defaultSize.height, minWidth, minHeight} = size;
    const newBrowserWindow = createBrowserWindow({
      width,
      height,
      minWidth,
      minHeight,
      closable,
      show: false,
      // skipTaskbar: id !== MAIN_APP_ID,
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
      if (forPrinting) {
        newBrowserWindow.minimize();
      } else if (size.width === undefined && size.height === undefined) {
        newBrowserWindow.maximize();
      }
      if (!forPrinting) {
        newBrowserWindow.show();
      }
      return windowInfo;
    } catch (err) {
      // If something went wrong, close the window and remove it from the window manager
      this.closeWindow(id);
      return Promise.reject(err);
    }
  }
}

export const windowManager = new WindowManager();
