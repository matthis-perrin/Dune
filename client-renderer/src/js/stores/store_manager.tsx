import {
  bobinesFillesStore,
  bobinesMeresStore,
  clichesStore,
  ListStore,
  perfosStore,
  refentesStore,
  stocksStore,
  operationsStore,
} from '@root/stores/list_store';

export type AnyListStore = ListStore<{localUpdate: Date}>;

export class StoreManager {
  private readonly WAIT_BETWEEN_REFRESHES = 1000;
  public static AllStores: AnyListStore[] = [
    bobinesFillesStore,
    bobinesMeresStore,
    clichesStore,
    stocksStore,
    perfosStore,
    refentesStore,
    operationsStore,
  ];

  constructor(private readonly stores: AnyListStore[]) {}

  public start(): void {
    this.stores.forEach(store => {
      this.refreshStore(store);
    });
  }

  private refreshStore(store: AnyListStore): void {
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
