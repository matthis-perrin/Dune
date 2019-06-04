import {bridge, BridgeListResponse} from '@root/lib/bridge';

import {BobineFille, BobineMere, Cliche, Perfo, Refente, Stock, Operation} from '@shared/models';
import {BaseStore} from '@shared/store';

export abstract class ListStore<T extends {localUpdate: Date}> extends BaseStore {
  private data?: T[] = undefined;
  private localUpdate: number = 0;
  private lastCheck: number = 0;

  public abstract async fetch(): Promise<BridgeListResponse<T>>;
  public abstract getId(element: T): string;

  private handleResponse(response: BridgeListResponse<T>): void {
    const {data} = response;
    if (data.length > 0) {
      this.lastCheck = Date.now();
      const newData = new Map<string, T>();
      let latestLocalUpdate = 0;
      data.forEach(element => {
        element.localUpdate = new Date(element.localUpdate);
        const localUpdateTimestamp = element.localUpdate.getTime();
        if (localUpdateTimestamp > latestLocalUpdate) {
          latestLocalUpdate = localUpdateTimestamp;
        }
        newData.set(this.getId(element), element);
      });
      this.localUpdate = latestLocalUpdate;
      if (this.data === undefined) {
        this.data = [];
      }
      this.data.forEach((element, index) => {
        const id = this.getId(element);
        const value = newData.get(id);
        if (value !== undefined && this.data !== undefined) {
          this.data[index] = value;
        }
        newData.delete(id);
      });
      this.data = this.data.concat(Array.from(newData.values()));
      this.emit();
    }
    if (data.length === 0 && this.lastCheck === 0) {
      this.data = [];
      this.lastCheck = Date.now();
      this.emit();
    }
  }

  public async refresh(): Promise<void> {
    const res = await this.fetch();
    this.handleResponse(res);
  }

  public getData(): T[] | undefined {
    return this.data;
  }

  public getLastUpdate(): number {
    return this.localUpdate;
  }

  public getLastCheck(): number {
    return this.lastCheck;
  }
}

function convertLastUpdateDates<T extends {lastUpdate?: Date; localUpdate: Date}>(data: T[]): void {
  data.forEach(val => {
    val.lastUpdate = val.lastUpdate && new Date(val.lastUpdate);
  });
}

class BobinesFillesStore extends ListStore<BobineFille> {
  public async fetch(): Promise<BridgeListResponse<BobineFille>> {
    const res = await bridge.listBobineFilles(this.getLastUpdate());
    convertLastUpdateDates(res.data);
    return res;
  }
  public getId(element: BobineFille): string {
    return element.ref;
  }
}
export const bobinesFillesStore = new BobinesFillesStore();

class BobinesMeresStore extends ListStore<BobineMere> {
  public async fetch(): Promise<BridgeListResponse<BobineMere>> {
    const res = await bridge.listBobineMeres(this.getLastUpdate());
    convertLastUpdateDates(res.data);
    return res;
  }
  public getId(element: BobineMere): string {
    return element.ref;
  }
}
export const bobinesMeresStore = new BobinesMeresStore();

class ClichesStore extends ListStore<Cliche> {
  public async fetch(): Promise<BridgeListResponse<Cliche>> {
    const res = await bridge.listCliches(this.getLastUpdate());
    convertLastUpdateDates(res.data);
    return res;
  }
  public getId(element: Cliche): string {
    return element.ref;
  }
}
export const clichesStore = new ClichesStore();

class StocksStore extends ListStore<Stock> {
  public async fetch(): Promise<BridgeListResponse<Stock>> {
    const res = await bridge.listStocks(this.getLastUpdate());
    convertLastUpdateDates(res.data);
    return res;
  }
  public getId(element: Stock): string {
    return element.ref;
  }
}
export const stocksStore = new StocksStore();

class PerfosStore extends ListStore<Perfo> {
  public async fetch(): Promise<BridgeListResponse<Perfo>> {
    const res = await bridge.listPerfos(this.getLastUpdate());
    convertLastUpdateDates(res.data);
    return res;
  }
  public getId(element: Perfo): string {
    return element.ref;
  }
}
export const perfosStore = new PerfosStore();

class RefentesStore extends ListStore<Refente> {
  public async fetch(): Promise<BridgeListResponse<Refente>> {
    const res = await bridge.listRefentes(this.getLastUpdate());
    convertLastUpdateDates(res.data);
    return res;
  }
  public getId(element: Refente): string {
    return element.ref;
  }
}
export const refentesStore = new RefentesStore();

class OperationsStore extends ListStore<Operation> {
  public async fetch(): Promise<BridgeListResponse<Operation>> {
    const res = await bridge.listOperations(this.getLastUpdate());
    convertLastUpdateDates(res.data);
    return res;
  }
  public getId(element: Operation): string {
    return String(element.id);
  }
}
export const operationsStore = new OperationsStore();
