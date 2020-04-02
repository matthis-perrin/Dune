import {bridge} from '@root/lib/bridge';
import {createSchedule} from '@root/lib/scheduler';
import {operationsStore, constantsStore} from '@root/stores/data_store';

import {
  Operation,
  ProdRange,
  PlanProduction,
  Prod,
  Stop,
  PlanProductionData,
  PlanProductionRaw,
  Schedule,
  Maintenance,
  SpeedTime,
  NonProd,
  ProdHours,
  Constants,
} from '@shared/models';
import {removeUndefined} from '@shared/type_utils';

export class ScheduleStore {
  private listener?: () => void;
  private readonly WAIT_BETWEEN_REFRESHES = 1000;
  private refreshTimeout: number | undefined;

  private operations?: Operation[];
  private constants?: Constants;
  private prodData?: {
    startedPlans: PlanProduction[];
    notStartedPlans: PlanProduction[];
    prods: Prod[];
    stops: Stop[];
    maintenances: Maintenance[];
    nonProds: NonProd[];
    prodRanges: Map<string, ProdRange>;
    lastSpeedTime?: SpeedTime;
  };

  private schedule?: Schedule;

  public constructor(private range?: {start: number; end: number}) {
    operationsStore.addListener(this.handleOperationsChanged);
    constantsStore.addListener(this.handleConstantsChanged);
  }

  public start(listener: () => void): void {
    this.listener = listener;
    this.refresh();
  }

  public stop(): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
  }

  public setRange(range?: {start: number; end: number}): void {
    this.range = range;
    this.schedule = undefined;
    this.prodData = undefined;
    this.emit();
    this.refresh();
  }

  public getSchedule(): Schedule | undefined {
    return this.schedule;
  }

  private readonly handleOperationsChanged = (): void => {
    this.operations = operationsStore.getData();
    this.recompute();
  };

  private readonly handleConstantsChanged = (): void => {
    const constants = constantsStore.getData();
    this.constants = constants && constants[0];
    this.recompute();
  };

  public refresh(): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
    this.performRefresh()
      .then(() => this.scheduleRefresh())
      .catch(() => this.scheduleRefresh());
  }

  public refreshOnce(listener: () => void): void {
    this.listener = listener;
    this.performRefresh().catch(() =>
      setTimeout(() => this.refreshOnce(listener), this.WAIT_BETWEEN_REFRESHES)
    );
  }

  public getOperations(): Operation[] | undefined {
    return this.operations;
  }

  private scheduleRefresh(): void {
    this.refreshTimeout = setTimeout(() => this.refresh(), this.WAIT_BETWEEN_REFRESHES);
  }

  public emulateWithPlan(planProd: PlanProduction, atIndex: number): Schedule | undefined {
    if (!this.operations || !this.prodData || !this.constants) {
      return undefined;
    }
    const {
      stops,
      startedPlans,
      prods,
      notStartedPlans,
      lastSpeedTime,
      prodRanges,
      maintenances,
      nonProds,
    } = this.prodData;

    const newNotStartedPlans = notStartedPlans.filter((p) => p.index < atIndex).concat([planProd]);

    return createSchedule(
      this.operations,
      prodRanges,
      startedPlans,
      newNotStartedPlans,
      prods,
      stops,
      maintenances,
      nonProds,
      this.constants,
      lastSpeedTime
    );
  }

  private recompute(): void {
    if (!this.operations || !this.prodData || !this.constants) {
      return;
    }
    const {
      stops,
      startedPlans,
      prods,
      notStartedPlans,
      lastSpeedTime,
      prodRanges,
      maintenances,
      nonProds,
    } = this.prodData;
    this.schedule = createSchedule(
      this.operations,
      prodRanges,
      startedPlans,
      notStartedPlans,
      prods,
      stops,
      maintenances,
      nonProds,
      this.constants,
      lastSpeedTime
    );

    this.emit();
  }

  private emit(): void {
    if (this.listener) {
      this.listener();
    }
  }

  private parsePlanProdData(data: string): PlanProductionData | undefined {
    try {
      return JSON.parse(data) as PlanProductionData;
    } catch {
      return undefined;
    }
  }

  private makeProdRanges(prodHours: ProdHours[]): Map<string, ProdRange> {
    const prodRanges = new Map<string, ProdRange>();
    prodHours.forEach((prodHour) => prodRanges.set(prodHour.day, prodHour));
    return prodRanges;
  }

  private transformPlanProdRaw(plans: PlanProductionRaw[]): PlanProduction[] {
    return removeUndefined(
      plans.map((planProd) => {
        const data = this.parsePlanProdData(planProd.data);
        if (!data) {
          return undefined;
        }
        return {...planProd, data};
      })
    );
  }

  private async performRefresh(): Promise<void> {
    const {
      notStartedPlans,
      prods,
      startedPlans,
      stops,
      maintenances,
      nonProds,
      prodHours,
      lastSpeedTime,
    } = await bridge.getScheduleInfo(this.range);
    this.prodData = {
      startedPlans: this.transformPlanProdRaw(startedPlans),
      notStartedPlans: this.transformPlanProdRaw(notStartedPlans),
      prods,
      stops,
      maintenances,
      nonProds,
      prodRanges: this.makeProdRanges(prodHours),
      lastSpeedTime,
    };
    this.recompute();
  }
}
