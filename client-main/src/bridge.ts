import {BrowserWindow} from 'electron';

import {cadencier} from '@root/cadencier';
import {openContextMenu} from '@root/context_menu';
import {SQLITE_DB} from '@root/db';
import {planProductionStore} from '@root/store';
import {windowManager} from '@root/window_manager';

import {sendBridgeEvent} from '@shared/bridge/bridge_main';
import {
  AddPlanBobine,
  BridgeCommand,
  ClearPlan,
  CloseApp,
  CloseAppOfType,
  CreateNewPlanProduction,
  CreateOrUpdateOperateur,
  CreateOrUpdateOperation,
  GetAppInfo,
  GetNewPlanProduction,
  ListBobinesFilles,
  ListBobinesMeres,
  ListCadencier,
  ListCliches,
  ListOperateurs,
  ListOperations,
  ListPerfos,
  ListRefentes,
  ListStocks,
  OpenApp,
  RemovePlanBobine,
  SetPlanPapier,
  SetPlanPerfo,
  SetPlanPolypro,
  SetPlanRefente,
  ListCadencierForBobine,
  ListBobinesQuantities,
  SetPlanTourCount,
  ListColors,
  SaveToPDF,
  ListPlansProduction,
  SavePlanProduction,
  OpenContextMenu,
  ContextMenuClosed,
  ContextMenuClicked,
  DeletePlanProduction,
} from '@shared/bridge/commands';
import {listBobinesFilles} from '@shared/db/bobines_filles';
import {listBobinesMeres} from '@shared/db/bobines_meres';
import {listBobinesQuantities} from '@shared/db/bobines_quantities';
import {listCliches} from '@shared/db/cliches';
import {listColors} from '@shared/db/colors';
import {listOperations, createOrUpdateOperation} from '@shared/db/operations';
import {listPerfos} from '@shared/db/perfos';
import {
  listPlansProduction,
  savePlanProduction,
  deletePlanProduction,
} from '@shared/db/plan_production';
import {listRefentes} from '@shared/db/refentes';
import {listStocks} from '@shared/db/stocks';
import {ClientAppType, ContextMenuForBridge} from '@shared/models';
import {asMap, asNumber, asString} from '@shared/type_utils';

// tslint:disable-next-line:no-any
export async function handleCommand(
  browserWindow: BrowserWindow,
  command: BridgeCommand,
  params: any
): Promise<any> {
  // Listing commands
  if (command === ListBobinesFilles) {
    const {localUpdate} = asMap(params);
    return {data: await listBobinesFilles(SQLITE_DB.Gescom, asNumber(localUpdate, 0))};
  }
  if (command === ListBobinesMeres) {
    const {localUpdate} = asMap(params);
    return {data: await listBobinesMeres(SQLITE_DB.Gescom, asNumber(localUpdate, 0))};
  }
  if (command === ListCliches) {
    const {localUpdate} = asMap(params);
    return {data: await listCliches(SQLITE_DB.Gescom, asNumber(localUpdate, 0))};
  }
  if (command === ListStocks) {
    const {localUpdate} = asMap(params);
    return {data: await listStocks(SQLITE_DB.Gescom, asNumber(localUpdate, 0))};
  }
  if (command === ListPerfos) {
    const {localUpdate} = asMap(params);
    return {data: await listPerfos(SQLITE_DB.Params, asNumber(localUpdate, 0))};
  }
  if (command === ListRefentes) {
    const {localUpdate} = asMap(params);
    return {data: await listRefentes(SQLITE_DB.Params, asNumber(localUpdate, 0))};
  }
  if (command === ListCadencier) {
    const {localUpdate} = asMap(params);
    return {data: cadencier.list(asNumber(localUpdate, 0))};
  }
  if (command === ListPlansProduction) {
    const {localUpdate} = asMap(params);
    return {data: await listPlansProduction(SQLITE_DB.Prod, asNumber(localUpdate, 0))};
  }
  if (command === ListCadencierForBobine) {
    const {bobineRef} = asMap(params);
    return cadencier.listAllForBobine(asString(bobineRef, ''));
  }
  if (command === ListBobinesQuantities) {
    return listBobinesQuantities(SQLITE_DB.Params);
  }
  if (command === ListColors) {
    return listColors(SQLITE_DB.Params);
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
  if (command === CloseAppOfType) {
    const {type} = asMap(params);
    windowManager.closeWindowOfType(asString(type, '') as ClientAppType);
    return Promise.resolve();
  }
  if (command === SaveToPDF) {
    const {windowId, title} = asMap(params);
    return windowManager.saveToPDF(asString(windowId, ''), asString(title, ''));
  }
  // if (command === Print) {
  //   const {windowId} = asMap(params);
  //   return windowManager.print(asString(windowId, ''));
  // }

  // Plan Production
  if (command === CreateNewPlanProduction) {
    const {year, month, day, indexInDay} = asMap(params);
    const id = await planProductionStore.createNewPlan(
      asNumber(year, 0),
      asNumber(month, 0),
      asNumber(day, 0),
      asNumber(indexInDay, 0)
    );
    return {id};
  }
  if (command === DeletePlanProduction) {
    const {year, month, day, indexInDay} = asMap(params);
    const id = await deletePlanProduction(
      SQLITE_DB.Prod,
      asNumber(year, 0),
      asNumber(month, 0),
      asNumber(day, 0),
      asNumber(indexInDay, 0)
    );
    return {id};
  }
  if (command === SavePlanProduction) {
    const {id, year, month, day, indexInDay, data} = asMap(params);
    return savePlanProduction(
      SQLITE_DB.Prod,
      asNumber(id, undefined),
      asNumber(year, 0),
      asNumber(month, 0),
      asNumber(day, 0),
      asNumber(indexInDay, 0),
      asString(data, '{}')
    );
  }

  if (command === GetNewPlanProduction) {
    const engine = planProductionStore.getEngine();
    if (!engine) {
      return Promise.reject('No plan production in progress');
    }
    return Promise.resolve({...engine.getPlanProductionState(), ...engine.getPlanProductionInfo()});
  }

  if (command === SetPlanPerfo) {
    const {ref} = asMap(params);
    const engine = planProductionStore.getEngine();
    if (!engine) {
      return Promise.reject('No plan production in progress');
    }
    engine.setPerfo(asString(ref, ''));
    return Promise.resolve();
  }
  if (command === SetPlanTourCount) {
    const {tourCount} = asMap(params);
    const engine = planProductionStore.getEngine();
    if (!engine) {
      return Promise.reject('No plan production in progress');
    }
    engine.setTourCount(asNumber(tourCount, undefined));
    return Promise.resolve();
  }
  if (command === SetPlanRefente) {
    const {ref} = asMap(params);
    const engine = planProductionStore.getEngine();
    if (!engine) {
      return Promise.reject('No plan production in progress');
    }
    engine.setRefente(asString(ref, ''));
    return Promise.resolve();
  }
  if (command === SetPlanPapier) {
    const {ref} = asMap(params);
    const engine = planProductionStore.getEngine();
    if (!engine) {
      return Promise.reject('No plan production in progress');
    }
    engine.setPapier(asString(ref, ''));
    return Promise.resolve();
  }
  if (command === SetPlanPolypro) {
    const {ref} = asMap(params);
    const engine = planProductionStore.getEngine();
    if (!engine) {
      return Promise.reject('No plan production in progress');
    }
    engine.setPolypro(asString(ref, ''));
    return Promise.resolve();
  }
  if (command === AddPlanBobine) {
    const {ref, pose} = asMap(params);
    const engine = planProductionStore.getEngine();
    if (!engine) {
      return Promise.reject('No plan production in progress');
    }
    engine.addBobine(asString(ref, ''), asNumber(pose, 0));
    return Promise.resolve();
  }
  if (command === RemovePlanBobine) {
    const {ref, pose} = asMap(params);
    const engine = planProductionStore.getEngine();
    if (!engine) {
      return Promise.reject('No plan production in progress');
    }
    engine.removeBobine(asString(ref, ''), asNumber(pose, undefined));
    return Promise.resolve();
  }
  if (command === ClearPlan) {
    const engine = planProductionStore.getEngine();
    if (!engine) {
      return Promise.reject('No plan production in progress');
    }
    engine.clearPlan();
    return Promise.resolve();
  }

  if (command === OpenContextMenu) {
    const {menuId, menuForBridge} = asMap(params);
    openContextMenu(
      browserWindow,
      (menuForBridge as unknown) as ContextMenuForBridge[],
      () => sendBridgeEvent(browserWindow, ContextMenuClosed, {menuId}),
      id => sendBridgeEvent(browserWindow, ContextMenuClicked, {menuId, menuItemId: id})
    );
  }

  // Operations Management
  if (command === ListOperations) {
    const {localUpdate} = asMap(params);
    return {data: await listOperations(SQLITE_DB.Params, asNumber(localUpdate, 0))};
  }
  if (command === CreateOrUpdateOperation) {
    const {operation} = asMap(params);
    // tslint:disable-next-line:no-unsafe-any
    return createOrUpdateOperation(SQLITE_DB.Params, operation);
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
