import {without} from 'lodash-es';

import {getWindowId} from '@root/lib/window_utils';

import {BridgeTransport} from '@shared/bridge/bridge_renderer';
import * as BridgeCommands from '@shared/bridge/commands';
import {
  BobineFille,
  BobineMere,
  Cliche,
  ClientAppInfo,
  ClientAppType,
  Operation,
  Perfo,
  PlanProductionState,
  Refente,
  Stock,
  Vente,
  Cadencier,
  BobineQuantities,
  Color,
  PlanProductionRaw,
  ContextMenuForBridge,
  PlanProductionInfo,
  PlanProductionData,
  PlanProduction,
  ProdInfo,
  UnplannedStop,
  Cleaning,
  StopType,
  StopInfo,
  ScheduleInfo,
  Constants,
  Config,
} from '@shared/models';

export interface BridgeListResponse<T> {
  data: T[];
  localUpdate: number;
}

// tslint:disable-next-line:no-any
type EventData = any;

export class Bridge {
  private readonly bridgeTransport = new BridgeTransport(this.handleEvent.bind(this));
  private readonly eventListeners = new Map<
    BridgeCommands.BridgeEvent,
    ((data: EventData) => void)[]
  >();

  private handleEvent(event: BridgeCommands.BridgeEvent, data: EventData): void {
    (this.eventListeners.get(event) || []).forEach(listener => listener(data));
  }

  public addEventListener(
    event: BridgeCommands.BridgeEvent,
    listener: (data: EventData) => void
  ): void {
    const listeners = this.eventListeners.get(event);
    if (!listeners) {
      this.eventListeners.set(event, [listener]);
    } else {
      listeners.push(listener);
    }
  }

  public removeEventListener(
    event: BridgeCommands.BridgeEvent,
    listener: (data: EventData) => void
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      this.eventListeners.set(event, without(listeners, listener));
    }
  }

  private async listGeneric<T>(
    command: BridgeCommands.BridgeCommand,
    localUpdate: number
  ): Promise<BridgeListResponse<T>> {
    return this.bridgeTransport.sendBridgeCommand<BridgeListResponse<T>>(command, {localUpdate});
  }

  public async listBobineFilles(localUpdate: number): Promise<BridgeListResponse<BobineFille>> {
    return this.listGeneric<BobineFille>(BridgeCommands.ListBobinesFilles, localUpdate);
  }
  public async listBobineMeres(localUpdate: number): Promise<BridgeListResponse<BobineMere>> {
    return this.listGeneric<BobineMere>(BridgeCommands.ListBobinesMeres, localUpdate);
  }
  public async listCliches(localUpdate: number): Promise<BridgeListResponse<Cliche>> {
    return this.listGeneric<Cliche>(BridgeCommands.ListCliches, localUpdate);
  }
  public async listStocks(localUpdate: number): Promise<BridgeListResponse<Stock>> {
    return this.listGeneric<Stock>(BridgeCommands.ListStocks, localUpdate);
  }
  public async listPerfos(localUpdate: number): Promise<BridgeListResponse<Perfo>> {
    return this.listGeneric<Perfo>(BridgeCommands.ListPerfos, localUpdate);
  }
  public async listRefentes(localUpdate: number): Promise<BridgeListResponse<Refente>> {
    return this.listGeneric<Refente>(BridgeCommands.ListRefentes, localUpdate);
  }
  public async listCadencier(localUpdate: number): Promise<BridgeListResponse<Cadencier>> {
    return this.listGeneric<Cadencier>(BridgeCommands.ListCadencier, localUpdate);
  }
  public async listCadencierForBobine(bobineRef: string): Promise<Vente[]> {
    return this.bridgeTransport.sendBridgeCommand<Vente[]>(BridgeCommands.ListCadencierForBobine, {
      bobineRef,
    });
  }
  public async listBobinesQuantities(): Promise<BobineQuantities[]> {
    return this.bridgeTransport.sendBridgeCommand<BobineQuantities[]>(
      BridgeCommands.ListBobinesQuantities
    );
  }
  public async listColors(): Promise<Color[]> {
    return this.bridgeTransport.sendBridgeCommand<Color[]>(BridgeCommands.ListColors);
  }
  public async listOperations(): Promise<Operation[]> {
    return this.bridgeTransport.sendBridgeCommand<Operation[]>(BridgeCommands.ListOperations);
  }
  public async listUnplannedStops(): Promise<UnplannedStop[]> {
    return this.bridgeTransport.sendBridgeCommand<UnplannedStop[]>(
      BridgeCommands.ListUnplannedStops
    );
  }
  public async listCleanings(): Promise<Cleaning[]> {
    return this.bridgeTransport.sendBridgeCommand<Cleaning[]>(BridgeCommands.ListCleanings);
  }
  public async listConstants(): Promise<Constants[]> {
    return this.bridgeTransport.sendBridgeCommand<Constants[]>(BridgeCommands.ListConstants);
  }

  public async createNewPlanProduction(index: number): Promise<{id: number}> {
    return this.bridgeTransport.sendBridgeCommand<{id: number}>(
      BridgeCommands.CreateNewPlanProduction,
      {index}
    );
  }
  public async deletePlanProduction(index: number): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(BridgeCommands.DeletePlanProduction, {
      index,
    });
  }
  public async movePlanProduction(
    id: number,
    fromIndex: number | undefined,
    toIndex: number
  ): Promise<void> {
    if (fromIndex === undefined) {
      return;
    }
    return this.bridgeTransport.sendBridgeCommand<void>(BridgeCommands.MovePlanProduction, {
      id,
      fromIndex,
      toIndex,
    });
  }
  public async saveNewPlanProduction(
    id: number,
    index: number,
    operationAtStartOfDay: boolean,
    productionAtStartOfDay: boolean,
    data: string
  ): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(BridgeCommands.SaveNewPlanProduction, {
      id,
      index,
      operationAtStartOfDay,
      productionAtStartOfDay,
      data,
    });
  }
  public async updatePlanProduction(id: number, data: PlanProductionData): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(BridgeCommands.UpdatePlanProduction, {
      id,
      data: JSON.stringify(data),
    });
  }
  public async updatePlanProductionInfo(id: number, info: PlanProductionInfo): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(BridgeCommands.UpdatePlanProductionInfo, {
      id,
      info,
    });
  }

  public async getPlanProductionEngineInfo(
    id: number
  ): Promise<PlanProductionState & PlanProductionInfo> {
    return this.bridgeTransport.sendBridgeCommand<PlanProductionState & PlanProductionInfo>(
      BridgeCommands.GetPlanProductionEngineInfo,
      {id}
    );
  }
  public async getPlanProduction(id: number): Promise<PlanProduction> {
    const planProdRaw = await this.bridgeTransport.sendBridgeCommand<PlanProductionRaw>(
      BridgeCommands.GetPlanProduction,
      {id}
    );
    return {
      ...planProdRaw,
      data: JSON.parse(planProdRaw.data) as PlanProductionData,
    };
  }

  public async setPlanTourCount(id: number, tourCount?: number): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(BridgeCommands.SetPlanTourCount, {
      id,
      tourCount,
    });
  }
  public async setPlanPerfo(id: number, ref?: string): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(BridgeCommands.SetPlanPerfo, {id, ref});
  }
  public async setPlanRefente(id: number, ref?: string): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(BridgeCommands.SetPlanRefente, {id, ref});
  }
  public async setPlanPapier(id: number, ref?: string): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(BridgeCommands.SetPlanPapier, {id, ref});
  }
  public async setPlanPolypro(id: number, ref?: string): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(BridgeCommands.SetPlanPolypro, {id, ref});
  }
  public async addPlanBobine(id: number, ref: string, pose: number): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(BridgeCommands.AddPlanBobine, {
      id,
      ref,
      pose,
    });
  }
  public async removePlanBobine(id: number, ref: string, pose?: number): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(BridgeCommands.RemovePlanBobine, {
      id,
      ref,
      pose,
    });
  }
  public async clearPlan(id: number): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(BridgeCommands.ClearPlan, {id});
  }

  public async viewBobine(bobineRef: string): Promise<void> {
    return this.openApp(ClientAppType.ViewBobineApp, {bobineRef});
  }

  public async viewDay(day: number): Promise<void> {
    return this.openApp(ClientAppType.ViewDayApp, {initialDay: day});
  }

  public async openDayStopWindow(day: number, stopStart: number): Promise<void> {
    return this.openApp(ClientAppType.StopApp, {day, stopStart});
  }

  public async getScheduleInfo(
    machine: string,
    range?: {start: number; end: number}
  ): Promise<ScheduleInfo> {
    return this.bridgeTransport.sendBridgeCommand<ScheduleInfo>(BridgeCommands.GetScheduleInfo, {
      range,
      machine,
    });
  }
  public async getProdInfo(start: number, end: number, machine: string): Promise<ProdInfo> {
    return this.bridgeTransport.sendBridgeCommand<ProdInfo>(BridgeCommands.GetProdInfo, {
      start,
      end,
      machine,
    });
  }
  public async updateStop(
    start: number,
    type: StopType,
    info: StopInfo,
    planProdId: number,
    maintenanceId: number | undefined
  ): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(BridgeCommands.UpdateStop, {
      start,
      type,
      info,
      planProdId,
      maintenanceId,
    });
  }
  public async startMaintenanceStop(maintenanceId: number): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(BridgeCommands.StartMaintenanceStop, {
      maintenanceId,
    });
  }
  public async deleteMaintenanceStop(maintenanceId: number): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(BridgeCommands.DeleteMaintenanceStop, {
      maintenanceId,
    });
  }
  public async endMaintenanceStop(maintenanceId: number): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(BridgeCommands.EndMaintenanceStop, {
      maintenanceId,
    });
  }

  public async createOrUpdateOperation(operation: Operation): Promise<Operation> {
    return this.bridgeTransport.sendBridgeCommand<Operation>(
      BridgeCommands.CreateOrUpdateOperation,
      {operation}
    );
  }

  public async createMaintenance(start: number, end: number, title: string): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(BridgeCommands.CreateMaintenance, {
      start,
      end,
      title,
    });
  }
  public async deleteMaintenance(id: number): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(BridgeCommands.DeleteMaintenance, {
      id,
    });
  }
  public async createNonProd(start: number, end: number, title: string): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(BridgeCommands.CreateNonProd, {
      start,
      end,
      title,
    });
  }
  public async deleteNonProd(id: number): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(BridgeCommands.DeleteNonProd, {
      id,
    });
  }

  public async getAppInfo(windowId: string): Promise<ClientAppInfo & {config: Config}> {
    return this.bridgeTransport.sendBridgeCommand<ClientAppInfo & {config: Config}>(
      BridgeCommands.GetAppInfo,
      {
        windowId,
      }
    );
  }
  public async openPlanProdEditorApp(
    id: number,
    start: number,
    end: number,
    isCreating: boolean
  ): Promise<void> {
    const ONE_WEEK_MS = 604800000; // 7 * 24 * 3600 * 1000
    return this.bridgeTransport.sendBridgeCommand<void>(BridgeCommands.OpenApp, {
      type: ClientAppType.PlanProductionEditorApp,
      data: {id, start: start - ONE_WEEK_MS, end: end + ONE_WEEK_MS, isCreating},
    });
  }
  // tslint:disable-next-line:no-any
  public async openApp(type: ClientAppType, data?: any): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(BridgeCommands.OpenApp, {type, data});
  }
  public async closeAppOfType(type: ClientAppType): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(BridgeCommands.CloseAppOfType, {type});
  }
  public async closeApp(): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(BridgeCommands.CloseApp, {
      windowId: getWindowId(),
    });
  }
  public async saveToPDF(title: string): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(BridgeCommands.SaveToPDF, {
      windowId: getWindowId(),
      title,
    });
  }
  public async printAsPDF(): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(BridgeCommands.PrintAsPDF, {
      windowId: getWindowId(),
    });
  }

  public async openContextMenu(
    menuId: string,
    menuForBridge: ContextMenuForBridge[]
  ): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(BridgeCommands.OpenContextMenu, {
      menuId,
      menuForBridge,
    });
  }
}

export const bridge = new Bridge();
