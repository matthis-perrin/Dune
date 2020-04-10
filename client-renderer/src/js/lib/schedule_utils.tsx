import {min, max, maxBy} from 'lodash-es';

import {dateAtHour} from '@shared/lib/time';
import {startOfDay} from '@shared/lib/utils';
import {
  ScheduledPlanProd,
  Schedule,
  PlanProdSchedule,
  PlanProductionStatus,
  Maintenance,
  Stop,
  StopType,
} from '@shared/models';
import {removeUndefined} from '@shared/type_utils';

export function getMaintenance(schedule: Schedule, maintenanceId: number): Maintenance | undefined {
  return schedule.maintenances.filter(m => m.id === maintenanceId)[0];
}

export function getPlanProd(schedule: Schedule, planProdId: number): ScheduledPlanProd | undefined {
  return schedule.plans.filter(p => p.planProd.id === planProdId)[0];
}

function allSchedulesAfterDate(schedule: Schedule, date: number): PlanProdSchedule[] {
  return schedule.plans.reduce((schedules, plan) => {
    plan.schedulePerDay.forEach((s, day) => {
      if (day >= date) {
        schedules.push(s);
      }
    });
    return schedules;
  }, [] as PlanProdSchedule[]);
}

export function getSchedulesFromStartOfDayUpTo(
  schedule: Schedule,
  maxStart: number
): PlanProdSchedule[] {
  const now = schedule.lastSpeedTime !== undefined ? schedule.lastSpeedTime.time : Date.now();
  const start = startOfDay(new Date(now)).getTime();
  const todayAndAfterSchedules = allSchedulesAfterDate(schedule, start);
  return todayAndAfterSchedules.filter(s => (getScheduleStart(s) || 0) < maxStart);
}

export function getPreviousSchedule(
  schedule: Schedule,
  planIndex: number
): ScheduledPlanProd | undefined {
  let previous: ScheduledPlanProd | undefined;
  for (const plan of schedule.plans) {
    if (plan.planProd.index === planIndex) {
      return previous;
    }
    previous = plan;
  }
}

export function getScheduleOperationTime(schedule: ScheduledPlanProd): number {
  console.log(schedule);
  let operationTime = 0;
  schedule.schedulePerDay.forEach(
    s => (operationTime += s.doneOperationsMs + s.plannedOperationsMs)
  );
  return operationTime;
}

export function getSchedulesForDay(schedule: Schedule, day: Date): PlanProdSchedule[] {
  const ts = dateAtHour(day, 0).getTime();
  return schedule.plans.reduce((schedules, plan) => {
    plan.schedulePerDay.forEach((s, scheduleDay) => {
      if (scheduleDay === ts) {
        schedules.push(s);
      }
    });
    return schedules;
  }, [] as PlanProdSchedule[]);
}

export function getPlanStatus(plan: ScheduledPlanProd): PlanProductionStatus {
  let status = PlanProductionStatus.PLANNED;
  plan.schedulePerDay.forEach(schedule => {
    if (
      status === PlanProductionStatus.PLANNED &&
      (schedule.status === PlanProductionStatus.IN_PROGRESS ||
        schedule.status === PlanProductionStatus.DONE)
    ) {
      status = schedule.status;
    } else if (
      status === PlanProductionStatus.IN_PROGRESS &&
      schedule.status === PlanProductionStatus.DONE
    ) {
      status = schedule.status;
    }
  });
  return status;
}

export function getAllPlannedSchedules(schedule: Schedule): ScheduledPlanProd[] {
  return schedule.plans.filter(p => getPlanStatus(p) === PlanProductionStatus.PLANNED);
}

export function getAllPlannedMaintenances(schedule: Schedule): Maintenance[] {
  const plannedMaintenanceIds = new Map<number, void>();
  schedule.plans.forEach(p => {
    p.schedulePerDay.forEach(s => {
      s.plannedStops.forEach(stop => {
        if (stop.maintenanceId !== undefined) {
          plannedMaintenanceIds.set(stop.maintenanceId);
        }
      });
    });
  });
  return schedule.maintenances.sort((m1, m2) => m1.start - m2.start);
}

export function getScheduleStarts(schedule: PlanProdSchedule): number[] {
  const stops = schedule.stops
    .concat(schedule.plannedStops)
    .filter(s => s.stopType !== StopType.NotProdHours);
  const prods = schedule.prods.concat(schedule.plannedProds);
  const events: {start?: number}[] = stops.concat(prods);
  return removeUndefined(events.map(e => e.start));
}

export function getScheduleEnds(schedule: PlanProdSchedule): number[] {
  const stops = schedule.stops
    .concat(schedule.plannedStops)
    .filter(s => s.stopType !== StopType.NotProdHours);
  const prods = schedule.prods.concat(schedule.plannedProds);
  const events: {end?: number}[] = stops.concat(prods);
  return removeUndefined(events.map(e => e.end));
}

export function getScheduleStart(schedule: PlanProdSchedule): number | undefined {
  return min(getScheduleStarts(schedule));
}

export function getScheduleEnd(schedule: PlanProdSchedule): number | undefined {
  return max(getScheduleEnds(schedule));
}

export function getPlanStart(plan: ScheduledPlanProd): number | undefined {
  return min(Array.from(plan.schedulePerDay.values()).map(getScheduleStart));
}

export function getStartForPlanIndex(schedule: Schedule, index: number): number {
  const planSchedule = maxBy(
    schedule.plans.filter(p => p.planProd.index <= index),
    p => p.planProd.index
  );
  if (planSchedule) {
    const planStart =
      planSchedule.planProd.index < index ? getPlanEnd(planSchedule) : getPlanStart(planSchedule);
    if (planStart) {
      return planStart;
    }
  }

  if (schedule.lastSpeedTime !== undefined) {
    return schedule.lastSpeedTime.time;
  }
  return startOfDay(new Date()).getTime();
}

export function getPlanEnd(plan: ScheduledPlanProd): number | undefined {
  return max(Array.from(plan.schedulePerDay.values()).map(getScheduleEnd));
}

export function getCurrentPlanSchedule(schedule: Schedule): PlanProdSchedule | undefined {
  const allSchedulesDoneOrInProgress = schedule.plans.reduce((schedules, plan) => {
    plan.schedulePerDay.forEach(s => {
      if (s.status !== PlanProductionStatus.PLANNED) {
        schedules.push(s);
      }
    });
    return schedules;
  }, [] as PlanProdSchedule[]);
  const scheduleWithStart = allSchedulesDoneOrInProgress.map(s => ({
    schedule: s,
    start: getScheduleStart(s) || 0,
  }));
  const lastScheduleWithStart =
    scheduleWithStart.length === 0
      ? undefined
      : scheduleWithStart.sort((s1, s2) => s2.start - s1.start)[0];
  return lastScheduleWithStart === undefined ? undefined : lastScheduleWithStart.schedule;
}

export function getCurrentPlanId(schedule: Schedule): number | undefined {
  const lastSchedule = getCurrentPlanSchedule(schedule);
  if (lastSchedule === undefined) {
    return undefined;
  }
  return lastSchedule.planProd.id;
}

function getPlanStops(plan: ScheduledPlanProd): Stop[] {
  return Array.from(plan.schedulePerDay.values()).reduce(
    (stops, schedule) => stops.concat(schedule.stops),
    [] as Stop[]
  );
}

function getAllStops(schedule: Schedule): Stop[] {
  return schedule.plans.reduce((stops, s) => stops.concat(getPlanStops(s)), [] as Stop[]);
}

export function getPreviousStop(schedule: Schedule, stop: Stop): Stop | undefined {
  const allStops = getAllStops(schedule).filter(
    s => s.stopType !== undefined && [StopType.NotProdHours].indexOf(s.stopType) === -1
  );
  return allStops.filter(s => s.start < stop.start).sort((s1, s2) => s2.start - s1.start)[0];
}

export function getProdTime(planSchedule: ScheduledPlanProd): number {
  return Array.from(planSchedule.schedulePerDay.values()).reduce(
    (prod, s) => prod + s.doneProdMs + s.plannedProdMs,
    0
  );
}
