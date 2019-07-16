import {without} from 'lodash-es';

import {getWindowId} from '@root/lib/window_utils';

import {BridgeTransport} from '@shared/bridge/bridge_renderer';
import {
  AddPlanBobine,
  BridgeCommand,
  BridgeEvent,
  ClearPlan,
  CloseApp,
  CloseAppOfType,
  CreateNewPlanProduction,
  CreateOrUpdateOperation,
  GetAppInfo,
  GetPlanProductionEngineInfo,
  ListBobinesFilles,
  ListBobinesMeres,
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
  ListCadencier,
  ListCadencierForBobine,
  ListBobinesQuantities,
  SetPlanTourCount,
  ListColors,
  SaveToPDF,
  Print,
  ListPlansProduction,
  OpenContextMenu,
  DeletePlanProduction,
  SaveNewPlanProduction,
  UpdatePlanProduction,
  UpdatePlanProductionInfo,
} from '@shared/bridge/commands';
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
} from '@shared/models';

export interface BridgeListResponse<T> {
  data: T[];
  localUpdate: number;
}

// tslint:disable-next-line:no-any
type EventData = any;

export class Bridge {
  private readonly bridgeTransport = new BridgeTransport(this.handleEvent.bind(this));
  private readonly eventListeners = new Map<BridgeEvent, ((data: EventData) => void)[]>();

  private handleEvent(event: BridgeEvent, data: EventData): void {
    (this.eventListeners.get(event) || []).forEach(listener => listener(data));
  }

  public addEventListener(event: BridgeEvent, listener: (data: EventData) => void): void {
    const listeners = this.eventListeners.get(event);
    if (!listeners) {
      this.eventListeners.set(event, [listener]);
    } else {
      listeners.push(listener);
    }
  }

  public removeEventListener(event: BridgeEvent, listener: (data: EventData) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      this.eventListeners.set(event, without(listeners, listener));
    }
  }

  private async listGeneric<T>(
    command: BridgeCommand,
    localUpdate: number
  ): Promise<BridgeListResponse<T>> {
    return this.bridgeTransport.sendBridgeCommand<BridgeListResponse<T>>(command, {localUpdate});
  }

  public async listBobineFilles(localUpdate: number): Promise<BridgeListResponse<BobineFille>> {
    return this.listGeneric<BobineFille>(ListBobinesFilles, localUpdate);
  }
  public async listBobineMeres(localUpdate: number): Promise<BridgeListResponse<BobineMere>> {
    return this.listGeneric<BobineMere>(ListBobinesMeres, localUpdate);
  }
  public async listCliches(localUpdate: number): Promise<BridgeListResponse<Cliche>> {
    return this.listGeneric<Cliche>(ListCliches, localUpdate);
  }
  public async listStocks(localUpdate: number): Promise<BridgeListResponse<Stock>> {
    return this.listGeneric<Stock>(ListStocks, localUpdate);
  }
  public async listPerfos(localUpdate: number): Promise<BridgeListResponse<Perfo>> {
    return this.listGeneric<Perfo>(ListPerfos, localUpdate);
  }
  public async listRefentes(localUpdate: number): Promise<BridgeListResponse<Refente>> {
    return this.listGeneric<Refente>(ListRefentes, localUpdate);
  }
  public async listCadencier(localUpdate: number): Promise<BridgeListResponse<Cadencier>> {
    return this.listGeneric<Cadencier>(ListCadencier, localUpdate);
  }
  public async listPlansProduction(
    localUpdate: number
  ): Promise<BridgeListResponse<PlanProductionRaw>> {
    return this.listGeneric<PlanProductionRaw>(ListPlansProduction, localUpdate);
  }
  public async listCadencierForBobine(bobineRef: string): Promise<Vente[]> {
    return this.bridgeTransport.sendBridgeCommand<Vente[]>(ListCadencierForBobine, {bobineRef});
  }
  public async listBobinesQuantities(): Promise<BobineQuantities[]> {
    return this.bridgeTransport.sendBridgeCommand<BobineQuantities[]>(ListBobinesQuantities);
  }
  public async listColors(): Promise<Color[]> {
    return this.bridgeTransport.sendBridgeCommand<Color[]>(ListColors);
  }
  public async listOperations(): Promise<Operation[]> {
    return this.bridgeTransport.sendBridgeCommand<Operation[]>(ListOperations);
  }

  public async createNewPlanProduction(index: number): Promise<{id: number}> {
    return this.bridgeTransport.sendBridgeCommand<{id: number}>(CreateNewPlanProduction, {index});
  }
  public async deletePlanProduction(index: number): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(DeletePlanProduction, {index});
  }
  public async saveNewPlanProduction(
    id: number,
    index: number,
    operationAtStartOfDay: boolean,
    productionAtStartOfDay: boolean,
    data: string
  ): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(SaveNewPlanProduction, {
      id,
      index,
      operationAtStartOfDay,
      productionAtStartOfDay,
      data,
    });
  }
  public async updatePlanProduction(id: number, data: PlanProductionData): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(UpdatePlanProduction, {
      id,
      data: JSON.stringify(data),
    });
  }
  public async updatePlanProductionInfo(id: number, info: PlanProductionInfo): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(UpdatePlanProductionInfo, {id, info});
  }

  public async getPlanProduction(id: number): Promise<PlanProductionState & PlanProductionInfo> {
    return this.bridgeTransport.sendBridgeCommand<PlanProductionState & PlanProductionInfo>(
      GetPlanProductionEngineInfo,
      {id}
    );
  }
  public async setPlanTourCount(id: number, tourCount?: number): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(SetPlanTourCount, {id, tourCount});
  }
  public async setPlanPerfo(id: number, ref?: string): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(SetPlanPerfo, {id, ref});
  }
  public async setPlanRefente(id: number, ref?: string): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(SetPlanRefente, {id, ref});
  }
  public async setPlanPapier(id: number, ref?: string): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(SetPlanPapier, {id, ref});
  }
  public async setPlanPolypro(id: number, ref?: string): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(SetPlanPolypro, {id, ref});
  }
  public async addPlanBobine(id: number, ref: string, pose: number): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(AddPlanBobine, {id, ref, pose});
  }
  public async removePlanBobine(id: number, ref: string, pose?: number): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(RemovePlanBobine, {id, ref, pose});
  }
  public async clearPlan(id: number): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(ClearPlan, {id});
  }

  public async viewBobine(bobineRef: string): Promise<void> {
    return this.openApp(ClientAppType.ViewBobineApp, {bobineRef});
  }

  public async createOrUpdateOperation(operation: Operation): Promise<Operation> {
    return this.bridgeTransport.sendBridgeCommand<Operation>(CreateOrUpdateOperation, {operation});
  }

  public async getAppInfo(windowId: string): Promise<ClientAppInfo> {
    return this.bridgeTransport.sendBridgeCommand<ClientAppInfo>(GetAppInfo, {windowId});
  }
  // tslint:disable-next-line:no-any
  public async openApp(type: ClientAppType, data?: any): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(OpenApp, {type, data});
  }
  public async closeAppOfType(type: ClientAppType): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(CloseAppOfType, {type});
  }
  public async closeApp(): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(CloseApp, {windowId: getWindowId()});
  }
  public async saveToPDF(title: string): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(SaveToPDF, {
      windowId: getWindowId(),
      title,
    });
  }
  public async print(): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(Print, {windowId: getWindowId()});
  }

  public async openContextMenu(
    menuId: string,
    menuForBridge: ContextMenuForBridge[]
  ): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(OpenContextMenu, {menuId, menuForBridge});
  }
}

export const bridge = new Bridge();
