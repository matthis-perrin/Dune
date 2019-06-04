import {without} from 'lodash-es';

import {getWindowId} from '@root/lib/window_utils';

import {BridgeTransport} from '@shared/bridge/bridge_renderer';
import {
  BridgeCommand,
  ListBobinesFilles,
  ListBobinesMeres,
  ListCliches,
  ListPerfos,
  ListRefentes,
  ListOperations,
  ListStocks,
  GetAppInfo,
  OpenApp,
  CreateOrUpdateOperation,
  CloseApp,
  BridgeEvent,
  CreateNewPlanProduction,
  GetNewPlanProduction,
} from '@shared/bridge/commands';
import {
  BobineFille,
  BobineMere,
  Cliche,
  Perfo,
  Refente,
  Operation,
  Stock,
  ClientAppInfo,
  ClientAppType,
  PlanProductionState,
} from '@shared/models';

export interface BridgeListResponse<T> {
  data: T[];
  localUpdate: number;
}

// tslint:disable-next-line:no-any
type EventData = any;

class Bridge {
  private readonly bridgeTransport = new BridgeTransport(this.handleEvent);
  private readonly eventListeners = new Map<BridgeEvent, ((data: EventData) => void)[]>();

  private handleEvent(event: BridgeEvent, data: EventData): void {}

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
  public async listOperations(localUpdate: number): Promise<BridgeListResponse<Operation>> {
    return this.listGeneric<Operation>(ListOperations, localUpdate);
  }

  public async createNewPlanProduction(): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(CreateNewPlanProduction);
  }
  public async getPlanProduction(): Promise<PlanProductionState> {
    return this.bridgeTransport.sendBridgeCommand<PlanProductionState>(GetNewPlanProduction);
  }

  public async viewOperation(operationId: number | undefined): Promise<void> {
    return this.openApp(ClientAppType.ViewOperationApp, {operationId});
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
  public async closeApp(): Promise<void> {
    return this.bridgeTransport.sendBridgeCommand<void>(CloseApp, {windowId: getWindowId()});
  }
}

export const bridge = new Bridge();
