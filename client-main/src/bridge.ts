import {db} from '@root/db';
import {windowManager} from '@root/window_manager';

import {
  BridgeCommand,
  ListBobinesFilles,
  ListBobinesMeres,
  ListCliches,
  ListPerfos,
  ListRefentes,
  ListStocks,
  GetAppInfo,
  OpenApp,
  ListOperations,
  CreateOperation,
  UpdateOperation,
} from '@shared/bridge/commands';
import {listBobinesFilles} from '@shared/db/bobines_filles';
import {listBobinesMeres} from '@shared/db/bobines_meres';
import {listCliches} from '@shared/db/cliches';
import {listOperations, createOperation} from '@shared/db/operations';
import {listPerfos} from '@shared/db/perfos';
import {listRefentes} from '@shared/db/refentes';
import {listStocks} from '@shared/db/stocks';

// tslint:disable-next-line:no-any
export async function handleCommand(command: BridgeCommand, params: any): Promise<any> {
  // Listing commands
  if (command === ListBobinesFilles) {
    const {localUpdate} = params;
    return {data: await listBobinesFilles(db, localUpdate)};
  }
  if (command === ListBobinesMeres) {
    const {localUpdate} = params;
    return {data: await listBobinesMeres(db, localUpdate)};
  }
  if (command === ListCliches) {
    const {localUpdate} = params;
    return {data: await listCliches(db, localUpdate)};
  }
  if (command === ListStocks) {
    const {localUpdate} = params;
    return {data: await listStocks(db, localUpdate)};
  }
  if (command === ListPerfos) {
    const {localUpdate} = params;
    return {data: await listPerfos(db, localUpdate)};
  }
  if (command === ListRefentes) {
    const {localUpdate} = params;
    return {data: await listRefentes(db, localUpdate)};
  }

  // Window Management
  if (command === GetAppInfo) {
    const {windowId} = params;
    const appInfo = windowManager.getAppInfo(windowId);
    if (!appInfo) {
      return Promise.reject(`Unknown window id ${windowId}`);
    }
    return Promise.resolve(appInfo);
  }
  if (command === OpenApp) {
    const {type, data} = params;
    return windowManager.openWindow({type, data});
  }

  // Operations Management
  if (command === ListOperations) {
    const {localUpdate} = params;
    return {data: await listOperations(db, localUpdate)};
  }
  if (command === CreateOperation) {
    const {operation} = params;
    return createOperation(db, operation);
  }
  if (command === UpdateOperation) {
  }
}
