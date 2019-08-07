import {
  bobinesQuantitiesStore,
  colorsStore,
  operationsStore,
  unplannedStopsStore,
  cleaningsStore,
} from '@root/stores/data_store';
import {
  bobinesFillesStore,
  bobinesMeresStore,
  clichesStore,
  perfosStore,
  refentesStore,
  stocksStore,
  cadencierStore,
} from '@root/stores/list_store';

export interface Refreshable {
  refresh(): Promise<void>;
}

export class StoreManager {
  private readonly WAIT_BETWEEN_REFRESHES = 1000;
  public static AllStores: Refreshable[] = [
    bobinesFillesStore,
    bobinesMeresStore,
    clichesStore,
    stocksStore,
    perfosStore,
    refentesStore,
    operationsStore,
    bobinesQuantitiesStore,
    colorsStore,
    cadencierStore,
    unplannedStopsStore,
    cleaningsStore,
  ];

  constructor(private readonly stores: Refreshable[]) {}

  public start(): void {
    this.stores.forEach(store => {
      this.refreshStore(store);
    });
  }

  private refreshStore(store: Refreshable): void {
    store
      .refresh()
      .finally(() => {
        setTimeout(() => {
          this.refreshStore(store);
        }, this.WAIT_BETWEEN_REFRESHES);
      })
      .catch(console.error);
  }
}
