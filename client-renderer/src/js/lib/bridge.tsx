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
} from '@shared/models';

export interface BridgeListResponse<T> {
  data: T[];
  localUpdate: number;
}

class Bridge {
  private readonly bridgeTransport = new BridgeTransport();

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
