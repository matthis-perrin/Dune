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
  GetAppInfo,
  ListBobinesFilles,
  ListBobinesMeres,
  ListCadencier,
  ListCliches,
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
  OpenContextMenu,
  ContextMenuClosed,
  ContextMenuClicked,
  DeletePlanProduction,
  GetPlanProductionEngineInfo,
  SaveNewPlanProduction,
  UpdatePlanProduction,
  UpdatePlanProductionInfo,
  MovePlanProduction,
} from '@shared/bridge/commands';
import {listBobinesFilles} from '@shared/db/bobines_filles';
import {listBobinesMeres} from '@shared/db/bobines_meres';
import {listBobinesQuantities} from '@shared/db/bobines_quantities';
import {listCliches} from '@shared/db/cliches';
import {listColors} from '@shared/db/colors';
import {listOperations} from '@shared/db/operations';
import {listPerfos} from '@shared/db/perfos';
import {
  listPlansProduction,
  deletePlanProduction,
  createPlanProduction,
  updatePlanProductionData,
  updatePlanProductionInfo,
  movePlanProduction,
} from '@shared/db/plan_production';
import {listRefentes} from '@shared/db/refentes';
import {listStocks} from '@shared/db/stocks';
import {ClientAppType, ContextMenuForBridge, PlanProductionInfo} from '@shared/models';
import {asMap, asNumber, asString, asBoolean} from '@shared/type_utils';

export async function handleCommand(
  browserWindow: BrowserWindow,
  command: BridgeCommand,
  // tslint:disable-next-line:no-any
  params: any
  // tslint:disable-next-line:no-any
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
  if (command === ListOperations) {
    return listOperations(SQLITE_DB.Params);
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

  // Plan Production
  if (command === CreateNewPlanProduction) {
    const {index} = asMap(params);
    const id = await planProductionStore.createNewPlan(asNumber(index, 0));
    return {id};
  }
  if (command === DeletePlanProduction) {
    const {index} = asMap(params);
    await deletePlanProduction(SQLITE_DB.Prod, asNumber(index, 0));
  }
  if (command === MovePlanProduction) {
    const {id, fromIndex, toIndex} = asMap(params);
    await movePlanProduction(
      SQLITE_DB.Prod,
      asNumber(id, 0),
      asNumber(fromIndex, 0),
      asNumber(toIndex, 0)
    );
  }
  if (command === SaveNewPlanProduction) {
    const {id, index, operationAtStartOfDay, productionAtStartOfDay, data} = asMap(params);
    return createPlanProduction(
      SQLITE_DB.Prod,
      asNumber(id, 0),
      asNumber(index, 0),
      asBoolean(operationAtStartOfDay),
      asBoolean(productionAtStartOfDay),
      asString(data, '{}')
    );
  }
  if (command === UpdatePlanProduction) {
    const {id, data} = asMap(params);
    return updatePlanProductionData(SQLITE_DB.Prod, asNumber(id, 0), asString(data, '{}'));
  }
  if (command === UpdatePlanProductionInfo) {
    const {id, info} = asMap(params);
    return updatePlanProductionInfo(SQLITE_DB.Prod, asNumber(id, 0), info as PlanProductionInfo);
  }

  if (command === GetPlanProductionEngineInfo) {
    const {id} = asMap(params);
    const engine = planProductionStore.getEngine(asNumber(id, 0));
    if (!engine) {
      return Promise.reject('No plan production in progress');
    }
    return Promise.resolve({...engine.getPlanProductionState(), ...engine.getPlanProductionInfo()});
  }

  if (command === SetPlanPerfo) {
    const {ref, id} = asMap(params);
    const engine = planProductionStore.getEngine(asNumber(id, 0));
    if (!engine) {
      return Promise.reject('No plan production in progress');
    }
    engine.setPerfo(asString(ref, ''));
    return Promise.resolve();
  }
  if (command === SetPlanTourCount) {
    const {tourCount, id} = asMap(params);
    const engine = planProductionStore.getEngine(asNumber(id, 0));
    if (!engine) {
      return Promise.reject('No plan production in progress');
    }
    engine.setTourCount(asNumber(tourCount, undefined));
    return Promise.resolve();
  }
  if (command === SetPlanRefente) {
    const {ref, id} = asMap(params);
    const engine = planProductionStore.getEngine(asNumber(id, 0));
    if (!engine) {
      return Promise.reject('No plan production in progress');
    }
    engine.setRefente(asString(ref, ''));
    return Promise.resolve();
  }
  if (command === SetPlanPapier) {
    const {ref, id} = asMap(params);
    const engine = planProductionStore.getEngine(asNumber(id, 0));
    if (!engine) {
      return Promise.reject('No plan production in progress');
    }
    engine.setPapier(asString(ref, ''));
    return Promise.resolve();
  }
  if (command === SetPlanPolypro) {
    const {ref, id} = asMap(params);
    const engine = planProductionStore.getEngine(asNumber(id, 0));
    if (!engine) {
      return Promise.reject('No plan production in progress');
    }
    engine.setPolypro(asString(ref, ''));
    return Promise.resolve();
  }
  if (command === AddPlanBobine) {
    const {ref, pose, id} = asMap(params);
    const engine = planProductionStore.getEngine(asNumber(id, 0));
    if (!engine) {
      return Promise.reject('No plan production in progress');
    }
    engine.addBobine(asString(ref, ''), asNumber(pose, 0));
    return Promise.resolve();
  }
  if (command === RemovePlanBobine) {
    const {ref, pose, id} = asMap(params);
    const engine = planProductionStore.getEngine(asNumber(id, 0));
    if (!engine) {
      return Promise.reject('No plan production in progress');
    }
    engine.removeBobine(asString(ref, ''), asNumber(pose, undefined));
    return Promise.resolve();
  }
  if (command === ClearPlan) {
    const {id} = asMap(params);
    const engine = planProductionStore.getEngine(asNumber(id, 0));
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
}
