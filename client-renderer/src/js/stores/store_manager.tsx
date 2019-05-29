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

class StoreManager {
  private readonly WAIT_BETWEEN_REFRESHES = 1000;
  private readonly stores: ListStore<{localUpdate: Date}>[] = [
    bobinesFillesStore,
    bobinesMeresStore,
    clichesStore,
    stocksStore,
    perfosStore,
    refentesStore,
    operationsStore,
  ];

  public start(): void {
    this.stores.forEach(store => {
      this.refreshStore(store);
    });
  }

  private refreshStore(store: ListStore<{localUpdate: Date}>): void {
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

export const storeManager = new StoreManager();
