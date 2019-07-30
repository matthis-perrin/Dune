import {bridge} from '@root/lib/bridge';
import {createSchedule} from '@root/lib/plan_prod_schedule';
import {operationsStore, prodHoursStore} from '@root/stores/data_store';

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
  MinuteSpeed,
} from '@shared/models';
import {removeUndefined} from '@shared/type_utils';

export class ScheduleStore {
  private listener?: () => void;
  private readonly WAIT_BETWEEN_REFRESHES = 1000;
  private refreshTimeout: number | undefined;

  private operations?: Operation[];
  private prodRanges?: Map<string, ProdRange>;
  private prodData?: {
    startedPlans: PlanProduction[];
    notStartedPlans: PlanProduction[];
    prods: Prod[];
    stops: Stop[];
    maintenances: Maintenance[];
    lastMinuteSpeed?: MinuteSpeed;
  };

  private schedule?: Schedule;

  public constructor(private startRange: number, private endRange: number) {
    operationsStore.addListener(this.handleOperationsChanged);
    prodHoursStore.addListener(this.handleProdHoursChanged);
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

  public setRange(startRange: number, endRange: number): void {
    this.startRange = startRange;
    this.endRange = endRange;
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

  private readonly handleProdHoursChanged = (): void => {
    this.prodRanges = prodHoursStore.getProdRanges();
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

  private scheduleRefresh(): void {
    this.refreshTimeout = setTimeout(() => this.refresh(), this.WAIT_BETWEEN_REFRESHES);
  }

  private recompute(): void {
    if (!this.operations || !this.prodRanges || !this.prodData) {
      return;
    }
    const {
      maintenances,
      stops,
      startedPlans,
      prods,
      notStartedPlans,
      lastMinuteSpeed,
    } = this.prodData;
    this.schedule = createSchedule(
      this.operations,
      this.prodRanges,
      startedPlans,
      notStartedPlans,
      prods,
      stops,
      maintenances,
      lastMinuteSpeed
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

  private transformPlanProdRaw(plans: PlanProductionRaw[]): PlanProduction[] {
    return removeUndefined(
      plans.map(planProd => {
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
      lastMinuteSpeed,
    } = await bridge.getScheduleInfo(this.startRange, this.endRange);
    this.prodData = {
      startedPlans: this.transformPlanProdRaw(startedPlans),
      notStartedPlans: this.transformPlanProdRaw(notStartedPlans),
      prods,
      stops,
      maintenances: [
        {
          startTime: new Date(2019, 6, 30, 6, 10).getTime(),
          endTime: new Date(2019, 6, 30, 6, 20).getTime(),
          id: 2,
        },
      ],
      lastMinuteSpeed,
    };
    this.recompute();
  }
}
