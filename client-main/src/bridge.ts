import {BrowserWindow} from 'electron';
import log from 'electron-log';

import {cadencier} from '@root/cadencier';
import {openContextMenu} from '@root/context_menu';
import {SQLITE_DB} from '@root/db';
import {planProductionStore} from '@root/plan_production_store';
import {prodHoursStore} from '@root/stores';
import {windowManager} from '@root/window_manager';

import {sendBridgeEvent} from '@shared/bridge/bridge_main';
import * as BridgeCommands from '@shared/bridge/commands';
import {listBobinesFilles} from '@shared/db/bobines_filles';
import {listBobinesMeres} from '@shared/db/bobines_meres';
import {listBobinesQuantities} from '@shared/db/bobines_quantities';
import {listCleanings} from '@shared/db/cleanings';
import {listCliches} from '@shared/db/cliches';
import {listColors} from '@shared/db/colors';
import {listConstants} from '@shared/db/constants';
import {
  createMaintenance,
  getMaintenancesBetween,
  deleteMaintenance,
} from '@shared/db/maintenances';
import {getNonProdsBetween, deleteNonProd, createNonProd} from '@shared/db/non_prods';
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
import {getSpeedProdBetween} from '@shared/db/speed_prods';
import {
  getSpeedStopBetween,
  updateStopInfo,
  getLastPlanProdChangeBefore,
  startMaintenanceStop,
  deleteMaintenanceStop,
  endMaintenanceStop,
} from '@shared/db/speed_stops';
import {getSpeedTimesBetween, getLastSpeedTime} from '@shared/db/speed_times';
import {listStocks} from '@shared/db/stocks';
import {listUnplannedStop} from '@shared/db/unplanned_stops';
import {startOfDay, endOfDay} from '@shared/lib/utils';
import {
  ClientAppType,
  ContextMenuForBridge,
  PlanProductionInfo,
  StopInfo,
  StopType,
  ScheduleInfo,
  ProdInfo,
  MachineType,
} from '@shared/models';
import {asMap, asNumber, asString, asBoolean} from '@shared/type_utils';
import {AllPromise} from '@shared/promise_utils';
import Knex from 'knex';

// tslint:disable-next-line: no-any
function getDbFromMachine(machine: any): Knex {
  const machineString = asString(machine, '');
  if (machineString === MachineType.Mondon) {
    return SQLITE_DB.Prod;
  }
  if (machineString === MachineType.Giave) {
    return SQLITE_DB.ProdGiave;
  }
  throw new Error('unknow machine');
}

export async function handleCommand(
  browserWindow: BrowserWindow,
  command: BridgeCommands.BridgeCommand,
  // tslint:disable-next-line:no-any
  params: any
  // tslint:disable-next-line:no-any
): Promise<any> {
  function debugLog(): void {
    log.debug(command, params);
  }

  // Listing commands
  if (command === BridgeCommands.ListBobinesFilles) {
    const {localUpdate} = asMap(params);
    return {
      data: await listBobinesFilles(SQLITE_DB.Gescom, SQLITE_DB.Params, asNumber(localUpdate, 0)),
    };
  }
  if (command === BridgeCommands.ListBobinesMeres) {
    const {localUpdate} = asMap(params);
    return {data: await listBobinesMeres(SQLITE_DB.Gescom, asNumber(localUpdate, 0))};
  }
  if (command === BridgeCommands.ListCliches) {
    const {localUpdate} = asMap(params);
    return {data: await listCliches(SQLITE_DB.Gescom, asNumber(localUpdate, 0))};
  }
  if (command === BridgeCommands.ListStocks) {
    const {localUpdate} = asMap(params);
    return {data: await listStocks(SQLITE_DB.Gescom, asNumber(localUpdate, 0))};
  }
  if (command === BridgeCommands.ListPerfos) {
    const {localUpdate} = asMap(params);
    return {data: await listPerfos(SQLITE_DB.Params, asNumber(localUpdate, 0))};
  }
  if (command === BridgeCommands.ListRefentes) {
    const {localUpdate} = asMap(params);
    return {data: await listRefentes(SQLITE_DB.Params, asNumber(localUpdate, 0))};
  }
  if (command === BridgeCommands.ListCadencier) {
    const {localUpdate} = asMap(params);
    return {data: cadencier.list(asNumber(localUpdate, 0))};
  }
  if (command === BridgeCommands.ListCadencierForBobine) {
    const {bobineRef} = asMap(params);
    return cadencier.listAllForBobine(asString(bobineRef, ''));
  }
  if (command === BridgeCommands.ListBobinesQuantities) {
    return listBobinesQuantities(SQLITE_DB.Params);
  }
  if (command === BridgeCommands.ListColors) {
    return listColors(SQLITE_DB.Params);
  }
  if (command === BridgeCommands.ListOperations) {
    return listOperations(SQLITE_DB.Params);
  }
  if (command === BridgeCommands.ListUnplannedStops) {
    return listUnplannedStop(SQLITE_DB.Params);
  }
  if (command === BridgeCommands.ListCleanings) {
    return listCleanings(SQLITE_DB.Params);
  }
  if (command === BridgeCommands.ListConstants) {
    return [await listConstants(SQLITE_DB.Params)];
  }

  // Window Management
  if (command === BridgeCommands.GetAppInfo) {
    debugLog();
    const {windowId} = asMap(params);
    const appInfo = windowManager.getAppInfo(asString(windowId, ''));
    if (!appInfo) {
      return Promise.reject(`Unknown window id ${windowId}`);
    }
    return Promise.resolve(appInfo);
  }
  if (command === BridgeCommands.OpenApp) {
    debugLog();
    const {type, data} = asMap(params);
    const appType = asString(type, '') as ClientAppType;
    await windowManager.openWindow({type: appType, data});
    return Promise.resolve();
  }
  if (command === BridgeCommands.CloseApp) {
    debugLog();
    const {windowId} = asMap(params);
    windowManager.closeWindow(asString(windowId, ''));
    return Promise.resolve();
  }
  if (command === BridgeCommands.CloseAppOfType) {
    debugLog();
    const {type} = asMap(params);
    windowManager.closeWindowOfType(asString(type, '') as ClientAppType);
    return Promise.resolve();
  }
  if (command === BridgeCommands.SaveToPDF) {
    debugLog();
    const {windowId, title} = asMap(params);
    return windowManager.saveToPDF(asString(windowId, ''), asString(title, ''));
  }
  if (command === BridgeCommands.PrintAsPDF) {
    debugLog();
    const {windowId} = asMap(params);
    return windowManager.printAsPDF(asString(windowId, ''));
  }

  // Plan Production
  if (command === BridgeCommands.CreateNewPlanProduction) {
    debugLog();
    const {index} = asMap(params);
    const id = await planProductionStore.createNewPlan(asNumber(index, 0));
    return {id};
  }
  if (command === BridgeCommands.DeletePlanProduction) {
    debugLog();
    const {index} = asMap(params);
    await deletePlanProduction(SQLITE_DB.Prod, asNumber(index, 0), log.debug);
  }
  if (command === BridgeCommands.MovePlanProduction) {
    debugLog();
    const {id, fromIndex, toIndex} = asMap(params);
    await movePlanProduction(
      SQLITE_DB.Prod,
      asNumber(id, 0),
      asNumber(fromIndex, 0),
      asNumber(toIndex, 0),
      log.debug
    );
  }
  if (command === BridgeCommands.SaveNewPlanProduction) {
    debugLog();
    const {id, index, operationAtStartOfDay, productionAtStartOfDay, data} = asMap(params);
    return createPlanProduction(
      SQLITE_DB.Prod,
      asNumber(id, 0),
      asNumber(index, 0),
      asBoolean(operationAtStartOfDay),
      asBoolean(productionAtStartOfDay),
      asString(data, '{}'),
      log.debug
    );
  }
  if (command === BridgeCommands.UpdatePlanProduction) {
    debugLog();
    const {id, data} = asMap(params);
    return updatePlanProductionData(SQLITE_DB.Prod, asNumber(id, 0), asString(data, '{}'));
  }
  if (command === BridgeCommands.UpdatePlanProductionInfo) {
    debugLog();
    const {id, info} = asMap(params);
    return updatePlanProductionInfo(SQLITE_DB.Prod, asNumber(id, 0), info as PlanProductionInfo);
  }

  if (command === BridgeCommands.GetPlanProductionEngineInfo) {
    debugLog();
    const {id} = asMap(params);
    const engine = planProductionStore.getEngine(asNumber(id, 0));
    if (!engine) {
      return Promise.reject('No plan production in progress');
    }
    return Promise.resolve({...engine.getPlanProductionState(), ...engine.getPlanProductionInfo()});
  }
  if (command === BridgeCommands.GetPlanProduction) {
    debugLog();
    const {id} = asMap(params);
    const planProd = await getPlanProd(SQLITE_DB.Prod, asNumber(id, 0));
    if (!planProd) {
      throw new Error(`No plan prod for id ${id}`);
    }
    return planProd;
  }

  if (command === BridgeCommands.SetPlanPerfo) {
    debugLog();
    const {ref, id} = asMap(params);
    const engine = planProductionStore.getEngine(asNumber(id, 0));
    if (!engine) {
      return Promise.reject('No plan production in progress');
    }
    engine.setPerfo(asString(ref, ''));
    return Promise.resolve();
  }
  if (command === BridgeCommands.SetPlanTourCount) {
    debugLog();
    const {tourCount, id} = asMap(params);
    const engine = planProductionStore.getEngine(asNumber(id, 0));
    if (!engine) {
      return Promise.reject('No plan production in progress');
    }
    engine.setTourCount(asNumber(tourCount, undefined));
    return Promise.resolve();
  }
  if (command === BridgeCommands.SetPlanRefente) {
    debugLog();
    const {ref, id} = asMap(params);
    const engine = planProductionStore.getEngine(asNumber(id, 0));
    if (!engine) {
      return Promise.reject('No plan production in progress');
    }
    engine.setRefente(asString(ref, ''));
    return Promise.resolve();
  }
  if (command === BridgeCommands.SetPlanPapier) {
    debugLog();
    const {ref, id} = asMap(params);
    const engine = planProductionStore.getEngine(asNumber(id, 0));
    if (!engine) {
      return Promise.reject('No plan production in progress');
    }
    engine.setPapier(asString(ref, ''));
    return Promise.resolve();
  }
  if (command === BridgeCommands.SetPlanPolypro) {
    debugLog();
    const {ref, id} = asMap(params);
    const engine = planProductionStore.getEngine(asNumber(id, 0));
    if (!engine) {
      return Promise.reject('No plan production in progress');
    }
    engine.setPolypro(asString(ref, ''));
    return Promise.resolve();
  }
  if (command === BridgeCommands.AddPlanBobine) {
    debugLog();
    const {ref, pose, id} = asMap(params);
    const engine = planProductionStore.getEngine(asNumber(id, 0));
    if (!engine) {
      return Promise.reject('No plan production in progress');
    }
    engine.addBobine(asString(ref, ''), asNumber(pose, 0));
    return Promise.resolve();
  }
  if (command === BridgeCommands.RemovePlanBobine) {
    debugLog();
    const {ref, pose, id} = asMap(params);
    const engine = planProductionStore.getEngine(asNumber(id, 0));
    if (!engine) {
      return Promise.reject('No plan production in progress');
    }
    engine.removeBobine(asString(ref, ''), asNumber(pose, undefined));
    return Promise.resolve();
  }
  if (command === BridgeCommands.ClearPlan) {
    debugLog();
    const {id} = asMap(params);
    const engine = planProductionStore.getEngine(asNumber(id, 0));
    if (!engine) {
      return Promise.reject('No plan production in progress');
    }
    engine.clearPlan();
    return Promise.resolve();
  }

  if (command === BridgeCommands.OpenContextMenu) {
    const {menuId, menuForBridge} = asMap(params);
    openContextMenu(
      browserWindow,
      (menuForBridge as unknown) as ContextMenuForBridge[],
      () => sendBridgeEvent(browserWindow, BridgeCommands.ContextMenuClosed, {menuId}),
      id =>
        sendBridgeEvent(browserWindow, BridgeCommands.ContextMenuClicked, {menuId, menuItemId: id})
    );
  }

  if (command === BridgeCommands.GetScheduleInfo) {
    const {range, machine} = asMap(params);
    const db = getDbFromMachine(machine);
    let rangeStart = asNumber(asMap(range).start, undefined);
    let rangeEnd = asNumber(asMap(range).end, undefined);

    const lastSpeedTime = await getLastSpeedTime(db, true);
    if (rangeStart === undefined) {
      rangeStart = lastSpeedTime ? startOfDay(new Date(lastSpeedTime.time)).getTime() : 0;
    }

    const lastPlanProdChange = await getLastPlanProdChangeBefore(db, rangeStart);
    rangeStart = lastPlanProdChange ? lastPlanProdChange.start : 0;

    if (rangeEnd === undefined) {
      rangeEnd = lastSpeedTime ? endOfDay(new Date(lastSpeedTime.time)).getTime() : Date.now() * 2;
    }

    const needNotStartedPlanProd = lastSpeedTime === undefined || rangeEnd > lastSpeedTime.time;

    const [stops, prods, notStartedPlans, startedPlans, maintenances, nonProds] = await AllPromise([
      getSpeedStopBetween(db, rangeStart, rangeEnd),
      getSpeedProdBetween(db, rangeStart, rangeEnd),
      needNotStartedPlanProd ? getNotStartedPlanProds(SQLITE_DB.Prod) : Promise.resolve([]),
      getStartedPlanProdsInRange(SQLITE_DB.Prod, rangeStart, rangeEnd, log.debug),
      getMaintenancesBetween(db, rangeStart, rangeEnd),
      getNonProdsBetween(db, rangeStart, rangeEnd),
    ]);
    const res: ScheduleInfo = {
      stops,
      prods,
      notStartedPlans,
      startedPlans,
      maintenances,
      nonProds,
      prodHours: prodHoursStore.getProdHours(),
      lastSpeedTime,
    };
    return res;
  }

  if (command === BridgeCommands.GetProdInfo) {
    const {start, end, machine} = asMap(params);
    console.log(start, end, machine);
    const db = getDbFromMachine(machine);
    const rangeStart = asNumber(start, 0);
    const rangeEnd = asNumber(end, 0);
    const [speedTimes] = await AllPromise([getSpeedTimesBetween(db, rangeStart, rangeEnd)]);
    const res: ProdInfo = {speedTimes};
    return res;
  }

  if (command === BridgeCommands.UpdateStop) {
    debugLog();
    const {start, type, info, planProdId, maintenanceId} = asMap(params);
    return updateStopInfo(
      SQLITE_DB.Prod,
      asNumber(start, 0),
      asString(type, '') as StopType,
      asMap(info) as StopInfo,
      asNumber(planProdId, undefined),
      asNumber(maintenanceId, undefined)
    );
  }
  if (command === BridgeCommands.StartMaintenanceStop) {
    debugLog();
    const {maintenanceId} = asMap(params);
    return startMaintenanceStop(SQLITE_DB.Prod, asNumber(maintenanceId, 0));
  }
  if (command === BridgeCommands.DeleteMaintenanceStop) {
    debugLog();
    const {maintenanceId} = asMap(params);
    return deleteMaintenanceStop(SQLITE_DB.Prod, asNumber(maintenanceId, 0));
  }
  if (command === BridgeCommands.EndMaintenanceStop) {
    debugLog();
    const {maintenanceId} = asMap(params);
    return endMaintenanceStop(SQLITE_DB.Prod, asNumber(maintenanceId, 0));
  }

  if (command === BridgeCommands.CreateMaintenance) {
    debugLog();
    const {start, end, title} = asMap(params);
    return createMaintenance(
      SQLITE_DB.Prod,
      asNumber(start, 0),
      asNumber(end, 0),
      asString(title, '')
    );
  }
  if (command === BridgeCommands.DeleteMaintenance) {
    debugLog();
    const {id} = asMap(params);
    return deleteMaintenance(SQLITE_DB.Prod, asNumber(id, 0));
  }
  if (command === BridgeCommands.CreateNonProd) {
    debugLog();
    const {start, end, title} = asMap(params);
    return createNonProd(SQLITE_DB.Prod, asNumber(start, 0), asNumber(end, 0), asString(title, ''));
  }
  if (command === BridgeCommands.DeleteNonProd) {
    debugLog();
    const {id} = asMap(params);
    return deleteNonProd(SQLITE_DB.Prod, asNumber(id, 0));
  }
}
