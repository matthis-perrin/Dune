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
  GetNewPlanProduction,
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
  SavePlanProduction,
  OpenContextMenu,
  DeletePlanProduction,
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

  public async createNewPlanProduction(
    year: number,
    month: number,
    day: number,
    indexInDay: number
  ): Promise<{id: number}> {
    return this.bridgeTransport.sendBridgeCommand<{id: number}>(CreateNewPlanProduction, {
      year,
      month,
      day,
      indexInDay,
    });
  }
  public async deletePlanProduction(
    year: number,
    month: number,
    day: number,
    indexInDay: number
  ): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(DeletePlanProduction, {
      year,
      month,
      day,
      indexInDay,
    });
  }
  public async savePlanProduction(
    id: number | undefined,
    year: number,
    month: number,
    day: number,
    indexInDay: number,
    data: string
  ): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(SavePlanProduction, {
      id,
      year,
      month,
      day,
      indexInDay,
      data,
    });
  }

  public async getPlanProduction(): Promise<PlanProductionState & PlanProductionInfo> {
    return this.bridgeTransport.sendBridgeCommand<PlanProductionState & PlanProductionInfo>(
      GetNewPlanProduction
    );
  }
  public async setPlanTourCount(tourCount?: number): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(SetPlanTourCount, {tourCount});
  }
  public async setPlanPerfo(ref?: string): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(SetPlanPerfo, {ref});
  }
  public async setPlanRefente(ref?: string): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(SetPlanRefente, {ref});
  }
  public async setPlanPapier(ref?: string): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(SetPlanPapier, {ref});
  }
  public async setPlanPolypro(ref?: string): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(SetPlanPolypro, {ref});
  }
  public async addPlanBobine(ref: string, pose: number): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(AddPlanBobine, {ref, pose});
  }
  public async removePlanBobine(ref: string, pose?: number): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(RemovePlanBobine, {ref, pose});
  }
  public async clearPlan(): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(ClearPlan);
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
