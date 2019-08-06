import {BrowserWindow} from 'electron';
import * as log from 'electron-log';

import {cadencier} from '@root/cadencier';
import {openContextMenu} from '@root/context_menu';
import {SQLITE_DB} from '@root/db';
import {planProductionStore} from '@root/plan_production_store';
import {prodHoursStore} from '@root/prod_hours_store';
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
  OpenContextMenu,
  ContextMenuClosed,
  ContextMenuClicked,
  DeletePlanProduction,
  GetPlanProductionEngineInfo,
  SaveNewPlanProduction,
  UpdatePlanProduction,
  UpdatePlanProductionInfo,
  MovePlanProduction,
  GetPlanProduction,
  GetProdInfo,
  ListUnplannedStops,
  ListCleanings,
  UpdateStop,
  ListProdHours,
  GetScheduleInfo,
  CreateStop,
  MergeStops,
  CreateMaintenance,
  CreateNonProd,
} from '@shared/bridge/commands';
import {listBobinesFilles} from '@shared/db/bobines_filles';
import {listBobinesMeres} from '@shared/db/bobines_meres';
import {listBobinesQuantities} from '@shared/db/bobines_quantities';
import {listCleanings} from '@shared/db/cleanings';
import {listCliches} from '@shared/db/cliches';
import {listColors} from '@shared/db/colors';
import {createMaintenance, getMaintenancesBetween} from '@shared/db/maintenances';
import {createNonProd, getNonProdsBetween} from '@shared/db/non_prod';
import {listOperations} from '@shared/db/operations';
import {listPerfos} from '@shared/db/perfos';
import {
  deletePlanProduction,
  createPlanProduction,
  updatePlanProductionData,
  updatePlanProductionInfo,
  movePlanProduction,
  getPlanProd,
  getNotStartedPlanProds,
  getStartedPlanProdsInRange,
} from '@shared/db/plan_production';
import {listRefentes} from '@shared/db/refentes';
import {getLastUsableSpeed, getMinutesSpeedsBetween} from '@shared/db/speed_minutes';
import {getSpeedProdBetween} from '@shared/db/speed_prods';
import {getSpeedStopBetween, updateStopInfo, createStop, mergeStops} from '@shared/db/speed_stops';
import {listStocks} from '@shared/db/stocks';
import {listUnplannedStop} from '@shared/db/unplanned_stops';
import {
  ClientAppType,
  ContextMenuForBridge,
  PlanProductionInfo,
  StopInfo,
  StopType,
  ScheduleInfo,
} from '@shared/models';
import {asMap, asNumber, asString, asBoolean} from '@shared/type_utils';

export async function handleCommand(
  browserWindow: BrowserWindow,
  command: BridgeCommand,
  // tslint:disable-next-line:no-any
  params: any
  // tslint:disable-next-line:no-any
): Promise<any> {
  function debugLog(): void {
    log.debug(command, params);
  }

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
  if (command === ListUnplannedStops) {
    return listUnplannedStop(SQLITE_DB.Params);
  }
  if (command === ListCleanings) {
    return listCleanings(SQLITE_DB.Params);
  }
  if (command === ListProdHours) {
    return prodHoursStore.getProdHours();
  }

  // Window Management
  if (command === GetAppInfo) {
    debugLog();
    const {windowId} = asMap(params);
    const appInfo = windowManager.getAppInfo(asString(windowId, ''));
    if (!appInfo) {
      return Promise.reject(`Unknown window id ${windowId}`);
    }
    return Promise.resolve(appInfo);
  }
  if (command === OpenApp) {
    debugLog();
    const {type, data} = asMap(params);
    const appType = asString(type, '') as ClientAppType;
    return windowManager.openWindow({type: appType, data});
  }
  if (command === CloseApp) {
    debugLog();
    const {windowId} = asMap(params);
    windowManager.closeWindow(asString(windowId, ''));
    return Promise.resolve();
  }
  if (command === CloseAppOfType) {
    debugLog();
    const {type} = asMap(params);
    windowManager.closeWindowOfType(asString(type, '') as ClientAppType);
    return Promise.resolve();
  }
  if (command === SaveToPDF) {
    debugLog();
    const {windowId, title} = asMap(params);
    return windowManager.saveToPDF(asString(windowId, ''), asString(title, ''));
  }

  // Plan Production
  if (command === CreateNewPlanProduction) {
    debugLog();
    const {index} = asMap(params);
    const id = await planProductionStore.createNewPlan(asNumber(index, 0));
    return {id};
  }
  if (command === DeletePlanProduction) {
    debugLog();
    const {index} = asMap(params);
    await deletePlanProduction(SQLITE_DB.Prod, asNumber(index, 0));
  }
  if (command === MovePlanProduction) {
    debugLog();
    const {id, fromIndex, toIndex} = asMap(params);
    await movePlanProduction(
      SQLITE_DB.Prod,
      asNumber(id, 0),
      asNumber(fromIndex, 0),
      asNumber(toIndex, 0)
    );
  }
  if (command === SaveNewPlanProduction) {
    debugLog();
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
    debugLog();
    const {id, data} = asMap(params);
    return updatePlanProductionData(SQLITE_DB.Prod, asNumber(id, 0), asString(data, '{}'));
  }
  if (command === UpdatePlanProductionInfo) {
    debugLog();
    const {id, info} = asMap(params);
    return updatePlanProductionInfo(SQLITE_DB.Prod, asNumber(id, 0), info as PlanProductionInfo);
  }

  if (command === GetPlanProductionEngineInfo) {
    debugLog();
    const {id} = asMap(params);
    const engine = planProductionStore.getEngine(asNumber(id, 0));
    if (!engine) {
      return Promise.reject('No plan production in progress');
    }
    return Promise.resolve({...engine.getPlanProductionState(), ...engine.getPlanProductionInfo()});
  }
  if (command === GetPlanProduction) {
    debugLog();
    const {id} = asMap(params);
    const planProd = await getPlanProd(SQLITE_DB.Prod, asNumber(id, 0));
    if (!planProd) {
      throw new Error(`No plan prod for id ${id}`);
    }
    return planProd;
  }

  if (command === SetPlanPerfo) {
    debugLog();
    const {ref, id} = asMap(params);
    const engine = planProductionStore.getEngine(asNumber(id, 0));
    if (!engine) {
      return Promise.reject('No plan production in progress');
    }
    engine.setPerfo(asString(ref, ''));
    return Promise.resolve();
  }
  if (command === SetPlanTourCount) {
    debugLog();
    const {tourCount, id} = asMap(params);
    const engine = planProductionStore.getEngine(asNumber(id, 0));
    if (!engine) {
      return Promise.reject('No plan production in progress');
    }
    engine.setTourCount(asNumber(tourCount, undefined));
    return Promise.resolve();
  }
  if (command === SetPlanRefente) {
    debugLog();
    const {ref, id} = asMap(params);
    const engine = planProductionStore.getEngine(asNumber(id, 0));
    if (!engine) {
      return Promise.reject('No plan production in progress');
    }
    engine.setRefente(asString(ref, ''));
    return Promise.resolve();
  }
  if (command === SetPlanPapier) {
    debugLog();
    const {ref, id} = asMap(params);
    const engine = planProductionStore.getEngine(asNumber(id, 0));
    if (!engine) {
      return Promise.reject('No plan production in progress');
    }
    engine.setPapier(asString(ref, ''));
    return Promise.resolve();
  }
  if (command === SetPlanPolypro) {
    debugLog();
    const {ref, id} = asMap(params);
    const engine = planProductionStore.getEngine(asNumber(id, 0));
    if (!engine) {
      return Promise.reject('No plan production in progress');
    }
    engine.setPolypro(asString(ref, ''));
    return Promise.resolve();
  }
  if (command === AddPlanBobine) {
    debugLog();
    const {ref, pose, id} = asMap(params);
    const engine = planProductionStore.getEngine(asNumber(id, 0));
    if (!engine) {
      return Promise.reject('No plan production in progress');
    }
    engine.addBobine(asString(ref, ''), asNumber(pose, 0));
    return Promise.resolve();
  }
  if (command === RemovePlanBobine) {
    debugLog();
    const {ref, pose, id} = asMap(params);
    const engine = planProductionStore.getEngine(asNumber(id, 0));
    if (!engine) {
      return Promise.reject('No plan production in progress');
    }
    engine.removeBobine(asString(ref, ''), asNumber(pose, undefined));
    return Promise.resolve();
  }
  if (command === ClearPlan) {
    debugLog();
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

  if (command === GetScheduleInfo) {
    const {start, end} = asMap(params);
    const rangeStart = asNumber(start, 0);
    const rangeEnd = asNumber(end, 0);
    const [
      stops,
      prods,
      notStartedPlans,
      startedPlans,
      maintenances,
      nonProds,
      lastMinuteSpeed,
    ] = await Promise.all([
      getSpeedStopBetween(SQLITE_DB.Prod, rangeStart, rangeEnd),
      getSpeedProdBetween(SQLITE_DB.Prod, rangeStart, rangeEnd),
      getNotStartedPlanProds(SQLITE_DB.Prod),
      getStartedPlanProdsInRange(SQLITE_DB.Prod, rangeStart, rangeEnd),
      getMaintenancesBetween(SQLITE_DB.Prod, rangeStart, rangeEnd),
      getNonProdsBetween(SQLITE_DB.Prod, rangeStart, rangeEnd),
      getLastUsableSpeed(SQLITE_DB.Prod),
    ]);
    const res: ScheduleInfo = {
      stops,
      prods,
      notStartedPlans,
      startedPlans,
      maintenances,
      nonProds,
      lastMinuteSpeed,
    };
    return res;
  }

  if (command === GetProdInfo) {
    const {start, end} = asMap(params);
    const rangeStart = asNumber(start, 0);
    const rangeEnd = asNumber(end, 0);
    const [stops, minuteSpeeds] = await Promise.all([
      getSpeedStopBetween(SQLITE_DB.Prod, rangeStart, rangeEnd),
      getMinutesSpeedsBetween(SQLITE_DB.Prod, rangeStart, rangeEnd),
    ]);
    return {stops, minuteSpeeds};
  }

  if (command === UpdateStop) {
    debugLog();
    const {start, type, info, planProdId, maintenanceId} = asMap(params);
    const prodRanges = prodHoursStore.getProdRanges();
    return updateStopInfo(
      SQLITE_DB.Prod,
      prodRanges,
      asNumber(start, 0),
      asString(type, '') as StopType,
      asMap(info) as StopInfo,
      asNumber(planProdId, undefined),
      asNumber(maintenanceId, undefined)
    );
  }
  if (command === CreateStop) {
    debugLog();
    const {stopStart, stopEnd} = asMap(params);
    return createStop(SQLITE_DB.Prod, asNumber(stopStart, 0), asNumber(stopEnd, 0));
  }
  if (command === MergeStops) {
    debugLog();
    const {start1, start2, mergedInfo, newEnd} = asMap(params);
    return mergeStops(
      SQLITE_DB.Prod,
      asNumber(start1, 0),
      asNumber(start2, 0),
      asMap(mergedInfo) as StopInfo,
      asNumber(newEnd, undefined)
    );
  }

  if (command === CreateMaintenance) {
    debugLog();
    const {start, end, title} = asMap(params);
    return createMaintenance(
      SQLITE_DB.Prod,
      asNumber(start, 0),
      asNumber(end, 0),
      asString(title, '')
    );
  }
  if (command === CreateNonProd) {
    debugLog();
    const {start, end, title} = asMap(params);
    return createMaintenance(
      SQLITE_DB.Prod,
      asNumber(start, 0),
      asNumber(end, 0),
      asString(title, '')
    );
  }
}
