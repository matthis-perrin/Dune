import {isEqual} from 'lodash-es';

import {bridge} from '@root/lib/bridge';
import {Palette, Colors} from '@root/theme';

import {BobineQuantities, Color} from '@shared/models';
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

class ColorsStore extends DataStore<Color> {
  private getDefaultColor(ref: string): Color {
    return {
      ref,
      name: ref,
      backgroundHex: Palette.White,
      textHex: Palette.Black,
      closeHex: Colors.Danger,
      hasBorder: true,
      description: `Couleur ${ref} est inconnue`,
    };
  }

  public async fetch(): Promise<Color[]> {
    return bridge.listColors();
  }
  public get(ref?: string): Color {
    for (const color of this.getData() || []) {
      if (color.ref === ref) {
        return color;
      }
    }
    return this.getDefaultColor(ref || 'NON DÉFINIE');
  }
}
export const colorsStore = new ColorsStore();
