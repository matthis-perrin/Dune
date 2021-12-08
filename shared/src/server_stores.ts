import knex from 'knex';

import {listConstants} from '@shared/db/constants';
import {listNonProds} from '@shared/db/non_prods';
import {listProdHours} from '@shared/db/prod_hours';
import {ProdRange, ProdHours, NonProd, Constants} from '@shared/models';
import {BaseStore} from '@shared/store';

export class ProdHoursStore extends BaseStore {
  private readonly WAIT_BETWEEN_REFRESHES = 1000;
  private refreshTimeout: NodeJS.Timeout | undefined;
  private prodHoursMap = new Map<string, ProdRange>();
  private prodHours: ProdHours[] = [];
  private nonProds: NonProd[] = [];

  public constructor(private readonly prodDB: knex, private readonly paramsDB: knex) {
    super();
  }

  public async start(): Promise<void> {
    await this.performRefresh();
    this.scheduleRefresh();
  }

  public getProdHours(): ProdHours[] {
    return this.prodHours;
  }

  public getProdRanges(): Map<string, ProdRange> {
    return this.prodHoursMap;
  }

  public getProdRange(day: string): ProdRange | undefined {
    return this.prodHoursMap.get(day);
  }

  public getProdRangeForTime(time: number): ProdRange | undefined {
    return this.getProdRange(new Date(time).toLocaleString('fr', {weekday: 'long'}));
  }

  public getNonProds(): NonProd[] {
    return this.nonProds;
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
      .catch(() => this.scheduleRefresh());
  }

  private async performRefresh(): Promise<void> {
    this.nonProds = await listNonProds(this.prodDB);
    this.prodHours = await listProdHours(this.paramsDB);
    this.prodHoursMap = new Map<string, ProdRange>();
    this.prodHours.forEach(prodHour => this.prodHoursMap.set(prodHour.day, prodHour));
    this.emit();
  }
}

export class ConstantsStore extends BaseStore {
  private readonly WAIT_BETWEEN_REFRESHES = 1000;
  private refreshTimeout: NodeJS.Timeout | undefined;

  private constants: Constants | undefined;

  public constructor(private readonly paramsDB: knex) {
    super();
  }

  public async start(): Promise<void> {
    await this.performRefresh();
    this.scheduleRefresh();
  }

  public getConstants(): Constants | undefined {
    return this.constants;
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
      .catch(() => this.scheduleRefresh());
  }

  private async performRefresh(): Promise<void> {
    this.constants = await listConstants(this.paramsDB);
    this.emit();
  }
}
