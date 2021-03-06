import {bridge} from '@root/lib/bridge';

import {endOfDay, startOfDay} from '@shared/lib/utils';
import {ProdInfo} from '@shared/models';
import {BaseStore} from '@shared/store';

export class ProdInfoStore extends BaseStore {
  private readonly WAIT_BETWEEN_REFRESHES = 1000;
  private refreshTimeout: number | undefined;

  private prodInfo: ProdInfo = {
    speedTimes: [],
  };

  public constructor(private day: number, private readonly machine: string) {
    super();
    this.refresh();
  }

  public setDay(day: number): void {
    this.day = day;
    this.prodInfo = {
      speedTimes: [],
    };
    this.refresh();
  }

  public getState(): ProdInfo {
    return this.prodInfo;
  }

  private refresh(): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
    this.performRefresh()
      .then(() => this.scheduleRefresh())
      .catch(() => this.scheduleRefresh());
  }

  private scheduleRefresh(): void {
    this.refreshTimeout = setTimeout(() => this.refresh(), this.WAIT_BETWEEN_REFRESHES);
  }

  private async performRefresh(): Promise<void> {
    const date = new Date(this.day);
    const start = startOfDay(date).getTime();
    const end = endOfDay(date).getTime();
    this.prodInfo = await bridge.getProdInfo(start, end, this.machine);
    this.emit();
  }
}
