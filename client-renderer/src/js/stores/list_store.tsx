import {bridge, BridgeListResponse} from '@root/lib/bridge';

import {getPosesForCliches, getCouleursForCliches} from '@shared/lib/cliches';
import {
  BobineFille,
  BobineMere,
  Cliche,
  Perfo,
  Refente,
  Stock,
  Operation,
  BobineFilleWithMultiPose,
  Cadencier,
  PlanProduction,
  PlanProductionData,
} from '@shared/models';
import {BaseStore} from '@shared/store';
import {removeUndefined} from '@shared/type_utils';

export abstract class ListStore<T extends {localUpdate: number}> extends BaseStore {
  protected data?: T[] = undefined;
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
        element.localUpdate = element.localUpdate;
        const localUpdateTimestamp = element.localUpdate;
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

class BobinesFillesStore extends ListStore<BobineFille> {
  public async fetch(): Promise<BridgeListResponse<BobineFille>> {
    return bridge.listBobineFilles(this.getLastUpdate());
  }
  public getId(element: BobineFille): string {
    return element.ref;
  }
}
export const bobinesFillesStore = new BobinesFillesStore();

class BobinesMeresStore extends ListStore<BobineMere> {
  public async fetch(): Promise<BridgeListResponse<BobineMere>> {
    return bridge.listBobineMeres(this.getLastUpdate());
  }
  public getId(element: BobineMere): string {
    return element.ref;
  }
}
export const bobinesMeresStore = new BobinesMeresStore();

class ClichesStore extends ListStore<Cliche> {
  public async fetch(): Promise<BridgeListResponse<Cliche>> {
    return bridge.listCliches(this.getLastUpdate());
  }
  public getId(element: Cliche): string {
    return element.ref;
  }
}
export const clichesStore = new ClichesStore();

class CadencierStore extends ListStore<Cadencier> {
  public async fetch(): Promise<BridgeListResponse<Cadencier>> {
    return bridge.listCadencier(this.getLastUpdate());
  }
  public getId(element: Cadencier): string {
    return element.bobineRef;
  }
  public getCadencierIndex(): Map<string, Map<number, number>> | undefined {
    const cadenciers = this.getData();
    if (cadenciers === undefined) {
      return undefined;
    }
    const cadencierIndex = new Map<string, Map<number, number>>();
    for (const cadencier of cadenciers) {
      let currentCadencier = cadencierIndex.get(cadencier.bobineRef);
      if (!currentCadencier) {
        currentCadencier = new Map<number, number>();
        cadencierIndex.set(cadencier.bobineRef, currentCadencier);
      }
      for (const monthStr of Object.keys(cadencier.ventes)) {
        const month = parseFloat(monthStr);
        currentCadencier.set(month, (currentCadencier.get(month) || 0) + cadencier.ventes[month]);
      }
    }
    return cadencierIndex;
  }
}
export const cadencierStore = new CadencierStore();

class StocksStore extends ListStore<Stock> {
  public async fetch(): Promise<BridgeListResponse<Stock>> {
    return bridge.listStocks(this.getLastUpdate());
  }
  public getId(element: Stock): string {
    return element.ref;
  }
  public getStockIndex(): Map<string, Stock[]> | undefined {
    const stocks = this.getData();
    if (stocks === undefined) {
      return undefined;
    }
    const stockIndex = new Map<string, Stock[]>();
    for (const stock of stocks) {
      const currentStock = stockIndex.get(stock.ref);
      if (!currentStock) {
        stockIndex.set(stock.ref, [stock]);
      } else {
        currentStock.push(stock);
      }
    }
    return stockIndex;
  }
}
export const stocksStore = new StocksStore();

class PerfosStore extends ListStore<Perfo> {
  public async fetch(): Promise<BridgeListResponse<Perfo>> {
    return bridge.listPerfos(this.getLastUpdate());
  }
  public getId(element: Perfo): string {
    return element.ref;
  }
}
export const perfosStore = new PerfosStore();

class RefentesStore extends ListStore<Refente> {
  public async fetch(): Promise<BridgeListResponse<Refente>> {
    return bridge.listRefentes(this.getLastUpdate());
  }
  public getId(element: Refente): string {
    return element.ref;
  }
}
export const refentesStore = new RefentesStore();

class OperationsStore extends ListStore<Operation> {
  public async fetch(): Promise<BridgeListResponse<Operation>> {
    return bridge.listOperations(this.getLastUpdate());
  }
  public getId(element: Operation): string {
    return element.ref;
  }
}
export const operationsStore = new OperationsStore();

class PlansProductionStore extends ListStore<PlanProduction> {
  public async fetch(): Promise<BridgeListResponse<PlanProduction>> {
    const raw = await bridge.listPlansProduction(this.getLastUpdate());
    const parsePlanProdData = (data: string): PlanProductionData | undefined => {
      try {
        return JSON.parse(data) as PlanProductionData;
      } catch {
        return undefined;
      }
    };
    const result = {
      ...raw,
      data: removeUndefined(
        raw.data.map(planProd => {
          const data = parsePlanProdData(planProd.data);
          if (!data) {
            return undefined;
          }
          return {...planProd, data};
        })
      ),
    };
    return result;
  }
  public getId(element: PlanProduction): string {
    return element.id.toString();
  }
  public getIndex(): Map<number, PlanProduction[]> | undefined {
    const plans = this.getData();
    if (plans === undefined) {
      return undefined;
    }
    const byDay = new Map<number, PlanProduction[]>();
    plans.forEach(p => {
      const date = new Date(p.data.day);
      date.setHours(0);
      date.setMinutes(0);
      date.setSeconds(0);
      date.setMilliseconds(0);
      const ts = date.getTime();
      const plans = byDay.get(ts);
      if (plans === undefined) {
        byDay.set(ts, [p]);
      } else {
        plans.push(p);
      }
    });
    return byDay;
  }
}
export const plansProductionStore = new PlansProductionStore();

class BobinesFillesWithMultiPoseStore extends ListStore<BobineFilleWithMultiPose> {
  constructor(
    private readonly _bobinesFillesStore: BobinesFillesStore,
    private readonly _clichesStore: ClichesStore
  ) {
    super();
    _bobinesFillesStore.addListener(this.recompute);
    _clichesStore.addListener(this.recompute);
    this.recompute();
  }

  public async fetch(): Promise<BridgeListResponse<BobineFilleWithMultiPose>> {
    return Promise.resolve({data: [], localUpdate: 0});
  }
  public getId(element: BobineFilleWithMultiPose): string {
    return element.ref;
  }

  private readonly recompute = (): void => {
    const bobinesFilles = this._bobinesFillesStore.getData();
    const cliches = this._clichesStore.getData();
    const bobinesFillesWithMultiPose: BobineFilleWithMultiPose[] = [];
    const clichesByRef = new Map<string, Cliche>();
    if (cliches) {
      cliches.forEach(c => clichesByRef.set(c.ref, c));
    }
    if (bobinesFilles) {
      bobinesFilles.forEach(b => {
        const cliche1 = b.refCliche1 === undefined ? undefined : clichesByRef.get(b.refCliche1);
        const cliche2 = b.refCliche2 === undefined ? undefined : clichesByRef.get(b.refCliche2);
        const poses = getPosesForCliches(cliche1, cliche2);
        const colors = getCouleursForCliches(cliche1, cliche2);
        bobinesFillesWithMultiPose.push({
          ...b,
          availablePoses: poses,
          allPoses: poses,
          colors,
        });
      });
    }
    this.data = bobinesFillesWithMultiPose;
    this.emit();
  };
}
export const bobinesFillesWithMultiPoseStore = new BobinesFillesWithMultiPoseStore(
  bobinesFillesStore,
  clichesStore
);
