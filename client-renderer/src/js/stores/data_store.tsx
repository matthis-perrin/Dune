import {isEqual} from 'lodash-es';

import {bridge} from '@root/lib/bridge';

import {BobineQuantities} from '@shared/models';
import {BaseStore} from '@shared/store';

export abstract class DataStore<T> extends BaseStore {
  protected data?: T[] = undefined;

  public abstract async fetch(): Promise<T[]>;

  private handleResponse(response: T[]): void {
    if (!isEqual(this.data, response)) {
      this.data = response;
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
}

class BobinesQuantitiesStore extends DataStore<BobineQuantities> {
  public async fetch(): Promise<BobineQuantities[]> {
    return bridge.listBobinesQuantities();
  }
}
export const bobinesQuantitiesStore = new BobinesQuantitiesStore();
