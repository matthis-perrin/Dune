import {startOfDay, dateIsBeforeOrSameDay, dateIsAfterOrSameDay} from '@root/lib/utils';

import {dateAtHour} from '@shared/lib/time';
import {ScheduledPlanProd, Schedule, PlanProdSchedule, PlanProductionStatus} from '@shared/models';

// function getPlanByIndex(schedule: Schedule, index: number): ScheduledPlanProd | undefined {
//   for (const plan of schedule.plans) {
//     if (plan.planProd.index === index) {
//       return plan;
//     }
//   }
//   return undefined;
// }

// function getPlanById(schedule: Schedule, id: number): ScheduledPlanProd | undefined {
//   for (const plan of schedule.plans) {
//     if (plan.planProd.id === id) {
//       return plan;
//     }
//   }
//   return undefined;
// }

function allSchedulesAfterDate(schedule: Schedule, date: number): PlanProdSchedule[] {
  return schedule.plans.reduce(
    (schedules, plan) => {
      plan.schedulePerDay.forEach((s, day) => {
        if (day >= date) {
          schedules.push(s);
        }
      });
      return schedules;
    },
    [] as PlanProdSchedule[]
  );
}

export function getSchedulesFromStartOfDay(
  schedule: Schedule,
  limitPlanIndex?: number
): PlanProdSchedule[] {
  const start = startOfDay().getTime();
  const todayAndAfterSchedules = allSchedulesAfterDate(schedule, start);
  if (limitPlanIndex === undefined) {
    return todayAndAfterSchedules;
  }
  return todayAndAfterSchedules.filter(
    s => s.status !== PlanProductionStatus.PLANNED || s.planProd.index < limitPlanIndex
  );
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

export function getMinimumScheduleRangeForDate(date: Date): {start: number; end: number} {
  const today = new Date();
  const start = new Date((dateIsBeforeOrSameDay(date, today) ? date : today).getTime());
  start.setDate(start.getDate() - 1);
  const startTime = dateAtHour(start, 0).getTime();
  const end = new Date((dateIsAfterOrSameDay(date, today) ? date : today).getTime());
  end.setDate(end.getDate() + 1);
  const endTime = dateAtHour(end, 0).getTime();
  return {start: startTime, end: endTime};
}

export function getScheduleOperationTime(schedule: ScheduledPlanProd): number {
  let operationTime = 0;
  schedule.schedulePerDay.forEach(
    s => (operationTime += s.doneOperationsMs + s.plannedOperationsMs)
  );
  return operationTime;
}

export function getSchedulesForDay(schedule: Schedule, day: Date): PlanProdSchedule[] {
  const ts = dateAtHour(day, 0).getTime();
  return schedule.plans.reduce(
    (schedules, plan) => {
      plan.schedulePerDay.forEach((s, scheduleDay) => {
        if (scheduleDay === ts) {
          schedules.push(s);
        }
      });
      return schedules;
    },
    [] as PlanProdSchedule[]
  );
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
