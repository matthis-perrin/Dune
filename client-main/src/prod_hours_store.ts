import * as log from 'electron-log';

import {SQLITE_DB} from '@root/db';

import {listProdHours} from '@shared/db/prod_hours';
import {ProdRange, ProdHours} from '@shared/models';

class ProdHoursStore {
  private readonly WAIT_BETWEEN_REFRESHES = 1000;
  private refreshTimeout: NodeJS.Timeout | undefined;
  private prodHoursMap = new Map<string, ProdRange>();
  private prodHours: ProdHours[] = [];

  public async start(): Promise<void> {
    await this.performRefresh();
    this.scheduleRefresh();
  }

  public getProdHours(): ProdHours[] {
    return this.prodHours;
  }

  public getProdRange(day: string): ProdRange | undefined {
    return this.prodHoursMap.get(day);
  }

  public getProdRangeForTime(time: number): ProdRange | undefined {
    return this.getProdRange(new Date(time).toLocaleString('fr', {weekday: 'long'}));
  }

  private scheduleRefresh(): void {
    this.refreshTimeout = setTimeout(() => this.refresh(), this.WAIT_BETWEEN_REFRESHES);
  }

  private refresh(): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
    this.performRefresh()
      .finally(() => this.scheduleRefresh())
      .catch(err => log.error(err));
  }

  private async performRefresh(): Promise<void> {
    const res = await listProdHours(SQLITE_DB.Params);
    this.prodHours = res;
    this.prodHoursMap = new Map<string, ProdRange>();
    res.forEach(prodHour => this.prodHoursMap.set(prodHour.day, prodHour));
  }
}

export const prodHoursStore = new ProdHoursStore();
