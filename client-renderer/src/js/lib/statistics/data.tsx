import {sum} from 'd3';
import {max, flatten, flattenDeep} from 'lodash-es';

import {StatsMetric, MetricFilter} from '@root/lib/statistics/metrics';
import {StatsPeriod} from '@root/lib/statistics/period';

import {getWeekDay, dateAtHour} from '@shared/lib/time';
import {
  Schedule,
  StopType,
  PlanProdSchedule,
  StatsData,
  PlanDayStats,
  ProdStat,
  StopStat,
  ProdRange,
  Operation,
} from '@shared/models';

const prodHourStartStopRegex = /^Production démarre à [0-9]+h[0-9]+$/;
const prodHourEndStopRegex = /^Production termine à [0-9]+h[0-9]+$/;

function isProdHourNonProd(title?: string): boolean {
  return (
    title !== undefined && (prodHourStartStopRegex.test(title) || prodHourEndStopRegex.test(title))
  );
}

export function computeStatsData(schedule: Schedule): StatsData {
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
        planDayStats.push(computePlanDayStats(planDaySchedule, planOperationTime * 1000, midTime));
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
      morningProds.push({metrage: (avgSpeed * morning) / (60 * 1000), duration: morning});
      afternoonProds.push({metrage: (avgSpeed * afternoon) / (60 * 1000), duration: afternoon});
    }
  });
  planDaySchedule.stops.forEach(({start, end, stopType, title}) => {
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
      if (isProdHourNonProd(title)) {
        return;
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

export function processStatsDataForDay(
  statsData: StatsData,
  operations: Operation[],
  date: number,
  metric: StatsMetric,
  filter: MetricFilter
): number {
  const dayStats = statsData.days.get(date);
  if (!dayStats) {
    return 0;
  }
  const values = dayStats.map(planDayStats => metric.yAxis(filter.name, planDayStats, operations));
  const flatValues = flatten(values);
  return metric.aggregation === 'sum' ? sum(flatValues) : sum(flatValues) / flatValues.length;
}

export function processStatsData(
  statsData: StatsData,
  prodHours: Map<string, ProdRange>,
  operations: Operation[],
  period: StatsPeriod,
  date: number,
  metric: StatsMetric,
  filter: MetricFilter
): number[] {
  const dateGroups = period.xAxis(statsData, prodHours, date);
  return dateGroups.map(dateGroup => {
    const values = dateGroup.map(date => {
      const dayStats = statsData.days.get(date);
      if (!dayStats) {
        return [];
      }
      const values = dayStats.map(planDayStats =>
        metric.yAxis(filter.name, planDayStats, operations)
      );
      return values;
    });
    const flatValues = flatten(flatten(values));
    return flatValues.length === 0
      ? 0
      : metric.aggregation === 'sum'
      ? sum(flatValues)
      : sum(flatValues) / flatValues.length;
  });
}
