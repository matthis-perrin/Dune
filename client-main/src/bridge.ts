import {db} from '@root/db';
import {planProductionStore} from '@root/store';
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
  CreateOrUpdateOperation,
  CloseApp,
  ListOperateurs,
  CreateOrUpdateOperateur,
  CreateNewPlanProduction,
  GetNewPlanProduction,
} from '@shared/bridge/commands';
import {listBobinesFilles} from '@shared/db/bobines_filles';
import {listBobinesMeres} from '@shared/db/bobines_meres';
import {listCliches} from '@shared/db/cliches';
import {listOperations, createOrUpdateOperation} from '@shared/db/operations';
import {listPerfos} from '@shared/db/perfos';
import {listRefentes} from '@shared/db/refentes';
import {listStocks} from '@shared/db/stocks';
import {ClientAppType} from '@shared/models';
import {asMap, asNumber, asString} from '@shared/type_utils';

// tslint:disable-next-line:no-any
export async function handleCommand(command: BridgeCommand, params: any): Promise<any> {
  // Listing commands
  if (command === ListBobinesFilles) {
    const {localUpdate} = asMap(params);
    return {data: await listBobinesFilles(db, asNumber(localUpdate, 0))};
  }
  if (command === ListBobinesMeres) {
    const {localUpdate} = asMap(params);
    return {data: await listBobinesMeres(db, asNumber(localUpdate, 0))};
  }
  if (command === ListCliches) {
    const {localUpdate} = asMap(params);
    return {data: await listCliches(db, asNumber(localUpdate, 0))};
  }
  if (command === ListStocks) {
    const {localUpdate} = asMap(params);
    return {data: await listStocks(db, asNumber(localUpdate, 0))};
  }
  if (command === ListPerfos) {
    const {localUpdate} = asMap(params);
    return {data: await listPerfos(db, asNumber(localUpdate, 0))};
  }
  if (command === ListRefentes) {
    const {localUpdate} = asMap(params);
    return {data: await listRefentes(db, asNumber(localUpdate, 0))};
  }

  // Window Management
  if (command === GetAppInfo) {
    const {windowId} = asMap(params);
    const appInfo = windowManager.getAppInfo(asString(windowId, ''));
    if (!appInfo) {
      return Promise.reject(`Unknown window id ${windowId}`);
    }
    return Promise.resolve(appInfo);
  }
  if (command === OpenApp) {
    const {type, data} = asMap(params);
    const appType = asString(type, '') as ClientAppType;
    return windowManager.openWindow({type: appType, data});
  }
  if (command === CloseApp) {
    const {windowId} = asMap(params);
    windowManager.closeWindow(asString(windowId, ''));
    return Promise.resolve();
  }

  // Plan Production
  if (command === CreateNewPlanProduction) {
    return planProductionStore.createNewPlan();
  }
  if (command === GetNewPlanProduction) {
    const planProduction = planProductionStore.getPlanProductionState();
    if (!planProduction) {
      return Promise.reject('No plan production available');
    }
    return Promise.resolve(planProduction);
  }

  // Operations Management
  if (command === ListOperations) {
    const {localUpdate} = asMap(params);
    return {data: await listOperations(db, asNumber(localUpdate, 0))};
  }
  if (command === CreateOrUpdateOperation) {
    const {operation} = asMap(params);
    // tslint:disable-next-line:no-unsafe-any
    return createOrUpdateOperation(db, operation);
  }

  // Operateurs Management
  if (command === ListOperateurs) {
    // const {localUpdate} = asMap(params);
    // return {data: await listOperateurs(db, asNumber(localUpdate, 0))};
  }
  if (command === CreateOrUpdateOperateur) {
    // const {operation} = asMap(params);
    // // tslint:disable-next-line:no-unsafe-any
    // return createOrUpdateOperateur(db, operation);
  }
}
