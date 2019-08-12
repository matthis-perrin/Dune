import {max} from 'lodash-es';
import * as React from 'react';

import {LoadingScreen} from '@root/components/core/loading_screen';
import {ScheduleStore} from '@root/stores/schedule_store';

import {getWeekDay, dateAtHour} from '@shared/lib/time';
import {Schedule, StopType, PlanProdSchedule} from '@shared/models';

interface StatistiquesAppProps {
  initialDay?: number;
}

interface StatistiquesAppState {
  schedule?: Schedule;
}

interface StatsData {
  days: Map<number, PlanDayStats[]>;
}

interface PlanDayStats {
  morningProds: ProdStat[];
  afternoonProds: ProdStat[];
  morningStops: StopStat[];
  afternoonStops: StopStat[];
  planTotalOperationDone: number;
  planTotalOperationPlanned: number;
  repriseProdDone: number;
}

interface ProdStat {
  metrage: number;
}

interface StopStat {
  type: StopType;
  duration: number;
  ratio: number;
}

function computeStatsData(schedule: Schedule): StatsData {
  const days = new Map<number, PlanDayStats[]>();
  schedule.plans.forEach(plan => {
    const {aideConducteur, chauffePerfo, chauffeRefente, conducteur} = plan.operations;
    const planOperationTime =
      max([aideConducteur, chauffePerfo, chauffeRefente, conducteur].map(o => o.total)) || 0;
    plan.schedulePerDay.forEach((planDaySchedule, day) => {
      const date = new Date(day);
      const prodRange = schedule.prodHours.get(getWeekDay(date));
      if (prodRange) {
        const midHour = (prodRange.startHour + prodRange.endHour) / 2;
        const midHourInteger = Math.floor(midHour);
        const midHourDecimal = midHour - midHourInteger;
        const midMinute = (prodRange.startMinute + prodRange.endMinute) / 2;
        const midMinuteInteger = Math.floor(midMinute);
        const midMinuteDecimal = midMinute - midMinuteInteger;
        const midTime = dateAtHour(
          date,
          midHourInteger,
          midMinuteInteger + midHourDecimal * 60,
          midMinuteDecimal * 60
        ).getTime();
        let planDayStats = days.get(day);
        if (!planDayStats) {
          planDayStats = [];
          days.set(day, planDayStats);
        }
        planDayStats.push(computePlanDayStats(planDaySchedule, planOperationTime, midTime));
      }
    });
  });
  return {days};
}

function computePlanDayStats(
  planDaySchedule: PlanProdSchedule,
  planOperationTime: number,
  midDay: number
): PlanDayStats {
  const planTotalOperationPlanned = planOperationTime;
  let planTotalOperationDone = 0;
  let repriseProdDone = 0;
  const morningProds: ProdStat[] = [];
  const afternoonProds: ProdStat[] = [];
  const morningStops: StopStat[] = [];
  const afternoonStops: StopStat[] = [];

  let isChangeProd = false;

  planDaySchedule.prods.forEach(({start, end, avgSpeed}) => {
    if (avgSpeed !== undefined && end !== undefined) {
      const {morning, afternoon} = getDuration(start, end, midDay);
      morningProds.push({metrage: (avgSpeed * morning) / (60 * 1000)});
      afternoonProds.push({metrage: (avgSpeed * afternoon) / (60 * 1000)});
    }
  });
  planDaySchedule.stops.forEach(({start, end, stopType}) => {
    if (stopType !== undefined && end !== undefined) {
      const {morning, afternoon} = getDuration(start, end, midDay);
      if (stopType === StopType.ChangePlanProd) {
        isChangeProd = true;
        planTotalOperationDone += morning + afternoon;
      }
      if (stopType === StopType.ReprisePlanProd) {
        repriseProdDone += morning + afternoon;
      }
      if (stopType === StopType.ReglagesAdditionel) {
        if (isChangeProd) {
          planTotalOperationDone += morning + afternoon;
        } else {
          repriseProdDone += morning + afternoon;
        }
      }
      morningStops.push({
        type: stopType,
        duration: morning,
        ratio: morning / (morning + afternoon),
      });
      afternoonStops.push({
        type: stopType,
        duration: afternoon,
        ratio: afternoon / (morning + afternoon),
      });
    }
  });

  return {
    morningProds,
    afternoonProds,
    morningStops,
    afternoonStops,
    planTotalOperationDone,
    planTotalOperationPlanned,
    repriseProdDone,
  };
}

function getDuration(
  start: number,
  end: number,
  midDay: number
): {morning: number; afternoon: number} {
  const total = end - start;
  if (total === 0) {
    return {morning: 0, afternoon: 0};
  }
  if (start >= midDay) {
    return {morning: 0, afternoon: total};
  }
  if (end <= midDay) {
    return {morning: total, afternoon: 0};
  }
  return {morning: midDay - start, afternoon: end - midDay};
}

// Retard = % temps operation * ( real temps operation / planned temps operation ) + sum end of day
//
//

export class StatistiquesApp extends React.Component<StatistiquesAppProps, StatistiquesAppState> {
  public static displayName = 'StatistiquesApp';

  private readonly scheduleStore: ScheduleStore;

  public constructor(props: StatistiquesAppProps) {
    super(props);
    this.state = {};
    this.scheduleStore = new ScheduleStore({start: 0, end: Date.now() * 2});
  }

  public componentDidMount(): void {
    this.scheduleStore.refreshOnce(this.handleScheduleChanged);
  }

  private readonly handleScheduleChanged = (): void => {
    const schedule = this.scheduleStore.getSchedule();
    if (!schedule) {
      return;
    }
    this.setState({schedule});
  };

  public render(): JSX.Element {
    const {schedule} = this.state;
    if (!schedule) {
      return <LoadingScreen />;
    }

    const statsData = computeStatsData(schedule);
    return <pre>{JSON.stringify(Array.from(statsData.days.entries()), undefined, 2)}</pre>;
  }
}
