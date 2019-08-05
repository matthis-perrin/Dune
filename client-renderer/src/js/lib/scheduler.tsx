import {max, maxBy} from 'lodash-es';

import {ADDITIONAL_TIME_TO_RESTART_PROD, MAX_SPEED_RATIO} from '@root/lib/constants';
import {metersToProductionTime, productionTimeToMeters} from '@root/lib/plan_prod';
import {getConstraints, splitOperations} from '@root/lib/plan_prod_operation';
import {computeMetrage} from '@root/lib/prod';

import {dateAtHour, getWeekDay} from '@shared/lib/time';
import {
  Operation,
  OperationConstraint,
  PlanProduction,
  Maintenance,
  ProdRange,
  Prod,
  Stop,
  Schedule,
  MinuteSpeed,
  AutomateEvent,
  ScheduledPlanProd,
  PlanProdSchedule,
  StopType,
  PlanProductionStatus,
} from '@shared/models';
import {removeUndefined} from '@shared/type_utils';

interface PlanEvents {
  prods: Prod[];
  stops: Stop[];
  plannedProds: Prod[];
  plannedStops: Stop[];
}

interface ScheduleSupportData {
  maintenances: Maintenance[];
  prodRanges: Map<string, ProdRange>;
  currentTime: number;
}

function startOfNextDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
}

function prodRangeAsDate(currentDate: Date, prodRange: ProdRange): {start: Date; end: Date} {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const day = currentDate.getDate();
  const start = new Date(year, month, day, prodRange.startHour, prodRange.startMinute);
  const end = new Date(year, month, day, prodRange.endHour, prodRange.endMinute);
  return {start, end};
}

function getProductionLengthMeters(planProd: PlanProduction): number {
  const {bobines, tourCount} = planProd.data;
  const bobineLength = bobines.length > 0 ? bobines[0].longueur || 0 : 0;
  return tourCount * bobineLength;
}

function getProdDoneMeters(schedules: Map<number, PlanProdSchedule>): number {
  return Array.from(schedules.values()).reduce(
    (prodDone, schedule) => prodDone + schedule.doneProdMeters,
    0
  );
}

function eventsOrder(event1: AutomateEvent, event2: AutomateEvent): number {
  if (event1.start !== event2.start) {
    return event1.start - event2.start;
  }
  if (event1.end !== undefined) {
    if (event2.end !== undefined) {
      return event1.end - event2.end;
    } else {
      return -1;
    }
  } else {
    if (event1.end === undefined) {
      return 1;
    } else {
      return 0;
    }
  }
}

function getFirstAutomateEvent(list: AutomateEvent[]): AutomateEvent | undefined {
  return list.sort(eventsOrder)[0];
}

function getLastAutomateEvent(list: AutomateEvent[]): AutomateEvent | undefined {
  return list.sort((e1, e2) => -eventsOrder(e1, e2))[0];
}

function getFirstEvent(planEvents: PlanEvents): AutomateEvent | undefined {
  const minProd = getFirstAutomateEvent(planEvents.prods);
  const minPlannedProd = getFirstAutomateEvent(planEvents.plannedProds);
  const minStop = getFirstAutomateEvent(planEvents.stops);
  const minPlannedStop = getFirstAutomateEvent(planEvents.plannedStops);
  const mins = removeUndefined([minProd, minPlannedProd, minStop, minPlannedStop]);
  return getFirstAutomateEvent(mins);
}

function getLastEvent(planEvents: PlanEvents): AutomateEvent | undefined {
  const maxProd = getLastAutomateEvent(planEvents.prods);
  const maxPlannedProd = getLastAutomateEvent(planEvents.plannedProds);
  const maxStop = getLastAutomateEvent(planEvents.stops);
  const maxPlannedStop = getLastAutomateEvent(planEvents.plannedStops);
  const maxs = removeUndefined([maxProd, maxPlannedProd, maxStop, maxPlannedStop]);
  return getLastAutomateEvent(maxs);
}

function getLastSchedule(
  schedulePerDay: Map<number, PlanProdSchedule>
): PlanProdSchedule | undefined {
  const maxDay = max(Array.from(schedulePerDay.keys()));
  if (maxDay === undefined) {
    return undefined;
  }
  return schedulePerDay.get(maxDay);
}

function getTotalOperationTimeDone(schedulePerDay: Map<number, PlanProdSchedule>): number {
  let total = 0;
  schedulePerDay.forEach(schedule => (total += schedule.doneOperationsMs));
  return total;
}

function mergeSchedule(schedule1: PlanProdSchedule, schedule2: PlanProdSchedule): PlanProdSchedule {
  return {
    status: schedule1.status,
    start: Math.min(schedule1.start, schedule2.start),
    end: Math.max(schedule1.end, schedule2.end),
    planProd: schedule1.planProd,
    // Done
    prods: schedule1.prods.concat(schedule2.prods).sort((p1, p2) => p1.start - p2.start),
    stops: schedule1.stops.concat(schedule2.stops).sort((s1, s2) => s1.start - s2.start),
    doneOperationsMs: schedule1.doneOperationsMs + schedule2.doneOperationsMs,
    doneProdMs: schedule1.doneProdMs + schedule2.doneProdMs,
    doneProdMeters: schedule1.doneProdMeters + schedule2.doneProdMeters,
    // Planned
    plannedProds: schedule1.plannedProds
      .concat(schedule2.plannedProds)
      .sort((p1, p2) => p1.start - p2.start),
    plannedStops: schedule1.plannedStops
      .concat(schedule2.plannedStops)
      .sort((s1, s2) => s1.start - s2.start),
    plannedOperationsMs: schedule1.plannedOperationsMs + schedule2.plannedOperationsMs,
    plannedProdMs: schedule1.plannedProdMs + schedule2.plannedProdMs,
    plannedProdMeters: schedule1.plannedProdMeters + schedule2.plannedProdMeters,
  };
}

function mergeSchedules(
  schedulesArr: Map<number, PlanProdSchedule>[]
): Map<number, PlanProdSchedule> {
  const mergedSchedules = new Map<number, PlanProdSchedule>();
  schedulesArr.forEach(schedules => {
    schedules.forEach((schedule, day) => {
      const s = mergedSchedules.get(day);
      mergedSchedules.set(day, s ? mergeSchedule(s, schedule) : schedule);
    });
  });
  return mergedSchedules;
}

function getEventDuration(event: AutomateEvent, currentTime: number): number {
  if (event.end) {
    return event.end - event.start;
  }
  return currentTime - event.start;
}

function isEndOfDayStop(stop: Stop): boolean {
  return stop.stopType === StopType.EndOfDayEndProd || stop.stopType === StopType.EndOfDayPauseProd;
}

function isStartOfDay(time: number, prodRanges: Map<string, ProdRange>): boolean {
  const date = new Date(time);
  const dayOfWeek = date.toLocaleString('fr-FR', {weekday: 'long'});
  const prodHours = prodRanges.get(dayOfWeek);
  if (!prodHours) {
    return false;
  }

  const {start} = prodRangeAsDate(date, prodHours);
  return time === start.getTime();
}

function popNextEvent(planEvents: PlanEvents): {event: Prod | Stop | undefined; isProd: boolean} {
  let event: Prod | Stop | undefined;
  let isProd = false;
  planEvents.prods.forEach(prod => {
    if (!event || event.start > prod.start) {
      event = prod;
      isProd = true;
    }
  });
  planEvents.stops.forEach(stop => {
    if (!event || event.start > stop.start) {
      event = stop;
      isProd = false;
    }
  });
  if (event) {
    const nextEventStart = event.start;
    if (isProd) {
      planEvents.prods = planEvents.prods.filter(p => p.start !== nextEventStart);
    } else {
      planEvents.stops = planEvents.stops.filter(s => s.start !== nextEventStart);
    }
  }
  return {event, isProd};
}

function nextValidTime(time: number, prodRanges: Map<string, ProdRange>): number {
  const date = new Date(time);
  const dayOfWeek = date.toLocaleString('fr-FR', {weekday: 'long'});
  const prodHours = prodRanges.get(dayOfWeek);
  if (!prodHours) {
    return nextValidTime(startOfNextDay(date).getTime(), prodRanges);
  }

  const {start, end} = prodRangeAsDate(date, prodHours);

  if (time >= end.getTime()) {
    return nextValidTime(startOfNextDay(date).getTime(), prodRanges);
  }
  const adjustedTimeWithStart = time < start.getTime() ? start.getTime() : time;
  const adjustedDate = new Date(adjustedTimeWithStart);
  return adjustedDate.getTime();
}

function lastValidConsecutiveProdTime(time: number, supportData: ScheduleSupportData): number {
  const date = new Date(time);
  const dayOfWeek = date.toLocaleString('fr-FR', {weekday: 'long'});
  const prodHours = supportData.prodRanges.get(dayOfWeek);
  if (!prodHours) {
    return time;
  }

  const {end} = prodRangeAsDate(date, prodHours);

  if (time >= end.getTime()) {
    return time;
  }
  const lastValidTime = end.getTime();
  const maintenanceBefore = supportData.maintenances
    .filter(m => m.startTime <= lastValidTime)
    .sort((m1, m2) => m1.startTime - m2.startTime)[0];
  if (maintenanceBefore) {
    return Math.max(time, maintenanceBefore.startTime);
  }
  return lastValidTime;
}

function getMaintenanceForTime(time: number, maintenances: Maintenance[]): Maintenance | undefined {
  return maintenances.filter(m => m.startTime <= time)[0];
}

function shouldCreateRestartProdStop(
  currentSchedules: Map<number, PlanProdSchedule>,
  currentTime: number
): boolean {
  const day = dateAtHour(new Date(currentTime), 0).getTime();
  const schedule = currentSchedules.get(day);
  if (schedule === undefined) {
    return true;
  }
  if (schedule.prods.length > 0) {
    return false;
  }
  if (
    schedule.stops
      .concat(schedule.plannedStops)
      .filter(
        s => s.stopType === StopType.ChangePlanProd || s.stopType === StopType.ReprisePlanProd
      ).length > 0
  ) {
    return false;
  }
  return true;
}

function getOrCreateScheduleForTime(
  time: number,
  planProd: PlanProduction,
  schedules: Map<number, PlanProdSchedule>
): PlanProdSchedule {
  const day = dateAtHour(new Date(time), 0).getTime();
  const schedule = schedules.get(day);
  if (schedule) {
    return schedule;
  }
  const emptySchedule: PlanProdSchedule = {
    status: PlanProductionStatus.PLANNED,
    start: 0,
    end: 0,
    planProd,
    prods: [],
    stops: [],
    doneOperationsMs: 0,
    doneProdMs: 0,
    doneProdMeters: 0,
    plannedProds: [],
    plannedStops: [],
    plannedOperationsMs: 0,
    plannedProdMs: 0,
    plannedProdMeters: 0,
  };
  schedules.set(day, emptySchedule);
  return emptySchedule;
}

function generatePlannedEventsForProdLeft(
  currentSchedules: Map<number, PlanProdSchedule>,
  metersToProduce: number,
  startTime: number,
  planProd: PlanProduction,
  supportData: ScheduleSupportData
): Map<number, PlanProdSchedule> {
  let plannedEvents = new Map<number, PlanProdSchedule>();
  // Find the next valid operation time
  let current = nextValidTime(startTime, supportData.prodRanges);

  // If there was no other prod this day and no ChangePlanProd or RepriseProd event
  // we need to add a RepriseProd event
  if (shouldCreateRestartProdStop(currentSchedules, current)) {
    const repriseProdEvents = generatePlannedEventsForStopLeft(
      ADDITIONAL_TIME_TO_RESTART_PROD,
      {
        start: 0,
        planProdId: planProd.id,
        stopType: StopType.ReprisePlanProd,
      },
      current,
      planProd,
      supportData
    );
    plannedEvents = mergeSchedules([plannedEvents, repriseProdEvents]);
    // Recompute the current time
    const lastRepriseSchedule = getLastSchedule(repriseProdEvents);
    if (lastRepriseSchedule) {
      const lastRepriseEvent = getLastEvent(lastRepriseSchedule);
      if (lastRepriseEvent && lastRepriseEvent.end) {
        current = nextValidTime(lastRepriseEvent.end, supportData.prodRanges);
      }
    }
  }

  // Perform a maintenance if we need to
  const maintenance = getMaintenanceForTime(current, supportData.maintenances);
  if (maintenance) {
    supportData.maintenances = supportData.maintenances.filter(m => m.id !== maintenance.id);
    const maintenanceStop: Stop = {
      start: current,
      maintenanceId: maintenance.id,
      planProdId: planProd.id,
      stopType: StopType.Maintenance,
    };
    const maintenanceEvents = generatePlannedEventsForStopLeft(
      maintenance.endTime - maintenance.startTime,
      maintenanceStop,
      current,
      planProd,
      supportData
    );
    plannedEvents = mergeSchedules([plannedEvents, maintenanceEvents]);
    // Recompute the current time
    const lastMaintenanceSchedule = getLastSchedule(maintenanceEvents);
    if (lastMaintenanceSchedule) {
      const lastMaintenanceEvent = getLastEvent(lastMaintenanceSchedule);
      if (lastMaintenanceEvent && lastMaintenanceEvent.end) {
        current = nextValidTime(lastMaintenanceEvent.end, supportData.prodRanges);
      }
    }
  }
  // Check how far we can go in time
  const targetProdTime = metersToProductionTime(metersToProduce, planProd.data.speed, true);
  const targetEndTime = current + targetProdTime;
  const schedule = getOrCreateScheduleForTime(current, planProd, plannedEvents);
  const lastPossibleEndTime = lastValidConsecutiveProdTime(current, supportData);
  const endTime = Math.min(targetEndTime, lastPossibleEndTime);
  // Add a planned prod up to the max we can go
  if (schedule.start === 0 || schedule.start > current) {
    schedule.start = current;
  }
  if (schedule.end < endTime) {
    schedule.end = endTime;
  }
  const actualProd = productionTimeToMeters(endTime - current, planProd.data.speed, true);
  schedule.plannedProdMeters += actualProd;
  schedule.plannedProdMs += endTime - current;
  schedule.plannedProds.push({
    start: current,
    end: endTime,
    planProdId: planProd.id,
    avgSpeed: planProd.data.speed * MAX_SPEED_RATIO,
  });
  // If we can't fit everything in one go, call the function again
  if (endTime < targetEndTime) {
    const restOfEvents = generatePlannedEventsForProdLeft(
      currentSchedules,
      metersToProduce - actualProd,
      endTime,
      planProd,
      supportData
    );
    plannedEvents = mergeSchedules([plannedEvents, restOfEvents]);
  }
  return plannedEvents;
}

function generatePlannedEventsForStopLeft(
  stopLeft: number,
  stop: Stop,
  startTime: number,
  planProd: PlanProduction,
  supportData: ScheduleSupportData
): Map<number, PlanProdSchedule> {
  let plannedEvents = new Map<number, PlanProdSchedule>();
  // Find the next valid operation time
  let current = nextValidTime(startTime, supportData.prodRanges);
  // Perform a maintenance if we need to
  const maintenance = getMaintenanceForTime(current, supportData.maintenances);
  if (maintenance) {
    supportData.maintenances = supportData.maintenances.filter(m => m.id !== maintenance.id);
    const maintenanceStop: Stop = {
      start: current,
      maintenanceId: maintenance.id,
      planProdId: planProd.id,
      stopType: StopType.Maintenance,
    };
    const maintenanceEvents = generatePlannedEventsForStopLeft(
      maintenance.endTime - maintenance.startTime,
      maintenanceStop,
      current,
      planProd,
      supportData
    );
    plannedEvents = mergeSchedules([plannedEvents, maintenanceEvents]);
    // Recompute the current time
    const lastMaintenanceSchedule = getLastSchedule(maintenanceEvents);
    if (lastMaintenanceSchedule) {
      const lastMaintenanceEvent = getLastEvent(lastMaintenanceSchedule);
      if (lastMaintenanceEvent && lastMaintenanceEvent.end) {
        current = nextValidTime(lastMaintenanceEvent.end, supportData.prodRanges);
      }
    }
    // Special case, if we were previously doing a ChangePlanProd or a RepriseProd.
    // After the maintenance this becomes a ReglagesAdditionel stop.
    if (stop.stopType === StopType.ChangePlanProd || stop.stopType === StopType.ReprisePlanProd) {
      stop = {...stop, stopType: StopType.ReglagesAdditionel};
    }
  }
  // Check how far we can go in time
  const targetEndTime = current + stopLeft;
  const schedule = getOrCreateScheduleForTime(current, planProd, plannedEvents);
  const lastPossibleEndTime = lastValidConsecutiveProdTime(current, supportData);
  const endTime = Math.min(targetEndTime, lastPossibleEndTime);
  // Add a planned stop up to the max we can go
  if (schedule.start === 0 || schedule.start > current) {
    schedule.start = current;
  }
  if (schedule.end < endTime) {
    schedule.end = endTime;
  }
  if (stop.stopType === StopType.ChangePlanProd || stop.stopType === StopType.ReglagesAdditionel) {
    schedule.plannedOperationsMs += endTime - current;
  }
  schedule.plannedStops.push({
    ...stop,
    start: current,
    end: endTime,
  });
  // If we can't fit everything in one go, call the function again
  if (endTime < targetEndTime) {
    const restOfEvents = generatePlannedEventsForStopLeft(
      stopLeft - (endTime - current),
      stop,
      endTime,
      planProd,
      supportData
    );
    plannedEvents = mergeSchedules([plannedEvents, restOfEvents]);
  }
  return plannedEvents;
}

function generateProdLeft(
  currentSchedules: Map<number, PlanProdSchedule>,
  planProd: PlanProduction,
  startTime: number,
  supportData: ScheduleSupportData
): Map<number, PlanProdSchedule> {
  // We don't finisht the prod if the last stop is a EndOfDayEndOfProd stop
  const lastSchedule = getLastSchedule(currentSchedules);
  if (lastSchedule) {
    const lastStopEvent = getLastAutomateEvent(lastSchedule.stops) as Stop | undefined;
    if (lastStopEvent !== undefined && lastStopEvent.stopType === StopType.EndOfDayEndProd) {
      return new Map<number, PlanProdSchedule>();
    }
  }

  const prodAlreadyDoneMeters = getProdDoneMeters(currentSchedules);
  const prodLengthMeters = getProductionLengthMeters(planProd);
  const leftToProduce = prodLengthMeters - prodAlreadyDoneMeters;
  if (leftToProduce <= 0) {
    return new Map<number, PlanProdSchedule>();
  }

  // If we need to pin to the start of the day, we adjust the start time
  if (planProd.productionAtStartOfDay && !isStartOfDay(startTime, supportData.prodRanges)) {
    startTime = nextValidTime(
      startOfNextDay(new Date(startTime)).getTime(),
      supportData.prodRanges
    );
  }
  return generatePlannedEventsForProdLeft(
    currentSchedules,
    leftToProduce,
    startTime,
    planProd,
    supportData
  );
}

function finishPlanProd(
  currentSchedules: Map<number, PlanProdSchedule>,
  planProd: PlanProduction,
  operationsTime: number,
  previousPlan: ScheduledPlanProd | undefined,
  supportData: ScheduleSupportData
): Map<number, PlanProdSchedule> {
  let newSchedules = currentSchedules;
  const lastSchedule = getLastSchedule(currentSchedules);

  // We only need to finish the plan if the last schedule is still in progress, or if there are no schedule
  // (plan has not started yet).
  if (lastSchedule && lastSchedule.status === PlanProductionStatus.DONE) {
    return newSchedules;
  }

  // If there is something in progress we need to "finish" it first
  if (lastSchedule && lastSchedule.status === PlanProductionStatus.IN_PROGRESS) {
    // Finish the last stop
    const lastStopEvent = maxBy(lastSchedule.stops, p => p.start);
    if (lastStopEvent !== undefined && lastStopEvent.end === undefined) {
      const endTime = supportData.currentTime;
      const lastStopEventType = lastStopEvent.stopType;
      let stopLeft = 0;
      // ChangePlanProd & ReglagesAdditionel stop - Finish the operation time of the plan prod.
      if (
        lastStopEventType === StopType.ChangePlanProd ||
        lastStopEventType === StopType.ReglagesAdditionel
      ) {
        stopLeft = operationsTime - getTotalOperationTimeDone(newSchedules);
      } else if (lastStopEventType === StopType.ReprisePlanProd) {
        stopLeft = ADDITIONAL_TIME_TO_RESTART_PROD - (endTime - lastStopEvent.start);
      } else if (isEndOfDayStop(lastStopEvent)) {
        const startDate = new Date(lastStopEvent.start);
        const endOfDay = supportData.prodRanges.get(getWeekDay(startDate));
        if (endOfDay) {
          stopLeft =
            dateAtHour(startDate, endOfDay.endHour, endOfDay.endMinute).getTime() - endTime;
        }
      } else if (lastStopEventType === StopType.EndOfDayPauseProd) {
        const startDate = new Date(lastStopEvent.start);
        const endOfDay = supportData.prodRanges.get(getWeekDay(startDate));
        if (endOfDay) {
          stopLeft =
            dateAtHour(startDate, endOfDay.endHour, endOfDay.endMinute).getTime() - endTime;
        }
      } else if (lastStopEventType === StopType.Maintenance) {
        if (lastStopEvent.maintenanceId !== undefined) {
          const maintenance = supportData.maintenances.filter(
            m => m.id === lastStopEvent.maintenanceId
          )[0];
          if (maintenance) {
            stopLeft =
              maintenance.endTime - maintenance.startTime - (endTime - lastStopEvent.start);
          }
          supportData.maintenances = supportData.maintenances.filter(
            m => m.id !== lastStopEvent.maintenanceId
          );
        }
      }

      if (lastStopEventType !== undefined && stopLeft > 0) {
        const plannedEventsForStop = generatePlannedEventsForStopLeft(
          stopLeft,
          {
            start: 0,
            planProdId: lastStopEvent.planProdId,
            stopType: lastStopEventType,
          },
          endTime,
          planProd,
          supportData
        );
        newSchedules = mergeSchedules([newSchedules, plannedEventsForStop]);
      }

      lastStopEvent.end = endTime;
      if (lastStopEventType === StopType.EndOfDayEndProd) {
        return newSchedules;
      }
      // Check if the first non-Maintenance event prior to a maintenance stop or an unknown stop
      // was a ChangePlanProd or a ReglagesAdditionel stop. If so we "finish" it with a
      // ReglagesAdditionel stop. We then finish the prod
      if (lastStopEventType === undefined || lastStopEventType === StopType.Maintenance) {
        const lastProd = Array.from(newSchedules.values())
          .reduce((prods, schedule) => prods.concat(schedule.prods), [] as Prod[])
          .sort((p1, p2) => -eventsOrder(p1, p2))[0];
        const lastProdEndTime =
          lastProd === undefined ? 0 : lastProd.end || supportData.currentTime;
        const stopBefore = Array.from(newSchedules.values())
          .reduce((stops, schedule) => stops.concat(schedule.stops), [] as Stop[])
          .filter(s => s.start >= lastProdEndTime && s.stopType !== StopType.Maintenance)
          .sort(eventsOrder)[0] as Stop | undefined;
        if (stopBefore !== undefined) {
          let otherStopLeft = 0;
          if (
            stopBefore.stopType === StopType.ChangePlanProd ||
            stopBefore.stopType === StopType.ReglagesAdditionel
          ) {
            otherStopLeft = operationsTime - getTotalOperationTimeDone(newSchedules);
          }
          if (stopBefore.stopType === StopType.ReprisePlanProd) {
            otherStopLeft = ADDITIONAL_TIME_TO_RESTART_PROD - (endTime - lastStopEvent.start);
          }
          if (otherStopLeft > 0) {
            const lastScheduleAfterMaintenance = getLastSchedule(newSchedules);
            if (lastScheduleAfterMaintenance) {
              const lastStopEventAfterMaintenance = maxBy(
                lastScheduleAfterMaintenance.stops,
                p => p.start
              );
              if (lastStopEventAfterMaintenance) {
                const lastStopEndTime =
                  lastStopEventAfterMaintenance.end !== undefined
                    ? lastStopEventAfterMaintenance.end
                    : supportData.currentTime;
                const plannedEventsForStop = generatePlannedEventsForStopLeft(
                  otherStopLeft,
                  {
                    start: 0,
                    planProdId: stopBefore.planProdId,
                    stopType: StopType.ReglagesAdditionel,
                  },
                  lastStopEndTime,
                  planProd,
                  supportData
                );
                newSchedules = mergeSchedules([newSchedules, plannedEventsForStop]);
              }
            }
          }
        }
      }
    }

    // Finish the last prod unless the last stop is a EndOfDayEndOfProd stop
    const lastProdEvent = maxBy(lastSchedule.prods, p => p.start);
    if (
      (lastStopEvent === undefined || lastStopEvent.stopType !== StopType.EndOfDayEndProd) &&
      lastProdEvent !== undefined &&
      lastProdEvent.end === undefined
    ) {
      const endTime = supportData.currentTime;
      const prodDuration = endTime - lastProdEvent.start;
      lastProdEvent.end = endTime;
      lastSchedule.doneProdMs += prodDuration;
      lastSchedule.doneProdMeters += productionTimeToMeters(
        prodDuration,
        lastProdEvent.avgSpeed || 0,
        false
      );
    }
  }

  if (!lastSchedule) {
    // If there are no schedule, we are dealing with a future plan.
    // So we first need to generate a ChangePlanProd event.
    let startTime = supportData.currentTime;
    if (previousPlan) {
      const previousPlanLastSchedule = getLastSchedule(previousPlan.schedulePerDay);
      if (previousPlanLastSchedule) {
        const previousPlanLastEvent = getLastEvent(previousPlanLastSchedule);
        if (previousPlanLastEvent && previousPlanLastEvent.end) {
          startTime = previousPlanLastEvent.end;
        }
      }
    }
    // If we need to pin to the start of the day, we adjust the start time
    if (planProd.operationAtStartOfDay && !isStartOfDay(startTime, supportData.prodRanges)) {
      startTime = nextValidTime(
        startOfNextDay(new Date(startTime)).getTime(),
        supportData.prodRanges
      );
    }
    const plannedEventsForProdChange = generatePlannedEventsForStopLeft(
      operationsTime,
      {start: 0, planProdId: planProd.id, stopType: StopType.ChangePlanProd},
      startTime,
      planProd,
      supportData
    );
    newSchedules = mergeSchedules([newSchedules, plannedEventsForProdChange]);
  }

  // Now we can finish the prod.
  const newLastSchedule = getLastSchedule(newSchedules);
  const start = newLastSchedule === undefined ? supportData.currentTime : newLastSchedule.end;
  const plannedEventsForProd = generateProdLeft(newSchedules, planProd, start, supportData);
  newSchedules = mergeSchedules([newSchedules, plannedEventsForProd]);

  return newSchedules;
}

function schedulePlanProd(
  operations: Operation[],
  supportData: ScheduleSupportData,
  planProd: PlanProduction,
  planEvents: PlanEvents,
  hasNextPlanStarted: boolean,
  previousPlan?: ScheduledPlanProd
): ScheduledPlanProd {
  let schedulePerDay = new Map<number, PlanProdSchedule>();

  // Process each events and put them in their respective schedule
  let {event, isProd} = popNextEvent(planEvents);
  while (event !== undefined) {
    const scheduleForEvent = getOrCreateScheduleForTime(event.start, planProd, schedulePerDay);
    if (isProd) {
      const prodEvent = event as Prod;
      if (prodEvent.end !== undefined) {
        const prodTime = getEventDuration(prodEvent, supportData.currentTime);
        const prodMeters = computeMetrage(prodTime, prodEvent.avgSpeed || 0);
        scheduleForEvent.doneOperationsMs += prodTime;
        scheduleForEvent.doneProdMeters += prodMeters;
      }
      scheduleForEvent.prods.push(prodEvent);
    } else {
      const stopEvent = event as Stop;
      if (
        stopEvent.stopType &&
        (stopEvent.stopType === StopType.ChangePlanProd ||
          stopEvent.stopType === StopType.ReprisePlanProd)
      ) {
        scheduleForEvent.doneOperationsMs += getEventDuration(stopEvent, supportData.currentTime);
      }
      scheduleForEvent.stops.push(stopEvent);
    }
    if (scheduleForEvent.start === 0 || scheduleForEvent.start > event.start) {
      scheduleForEvent.start = event.start;
    }
    if (event.end && scheduleForEvent.end < event.end) {
      scheduleForEvent.end = event.end;
    }
    ({event, isProd} = popNextEvent(planEvents));
  }

  // Mark the schedules of past events as DONE
  const lastSchedule = getLastSchedule(schedulePerDay);
  schedulePerDay.forEach(schedule => {
    schedule.status = PlanProductionStatus.DONE;
  });

  // Except for the last schedule that could still be in progress
  // i.e the next plan has not started yet and there is no end of day stops
  if (lastSchedule && !hasNextPlanStarted) {
    const endOfDayEndProdStops = lastSchedule.stops.filter(
      s => s.stopType === StopType.EndOfDayEndProd
    );
    const endOfDayPauseProdStops = lastSchedule.stops.filter(
      s => s.stopType === StopType.EndOfDayPauseProd
    );
    const lastEvent = getLastEvent(lastSchedule);
    if (
      (endOfDayEndProdStops.length === 0 && endOfDayPauseProdStops.length === 0) ||
      (lastEvent && lastEvent.end === undefined)
    ) {
      lastSchedule.status = PlanProductionStatus.IN_PROGRESS;
      // If the last event of the schedule is still in progress, we update the schedule end
      // to be the last minute speed
      if (lastEvent && lastEvent.end === undefined) {
        lastSchedule.end = supportData.currentTime;
      }
    } else {
      // However if there is still some prod left (without a EndOfDayEndProd event), we need
      // to create an empty IN_PROGRESS schedule for the next day that we'll complete later.
      const prodLeft = getProductionLengthMeters(planProd) - getProdDoneMeters(schedulePerDay);
      if (endOfDayEndProdStops.length === 0 && prodLeft > 0) {
        const nextScheduleStart = nextValidTime(
          dateAtHour(new Date(lastSchedule.start), 24).getTime(),
          supportData.prodRanges
        );
        const nextSchedule = getOrCreateScheduleForTime(
          nextScheduleStart,
          planProd,
          schedulePerDay
        );
        nextSchedule.status = PlanProductionStatus.IN_PROGRESS;
        nextSchedule.start = nextScheduleStart;
        nextSchedule.end = nextScheduleStart;
      }
    }
  }

  // Gather some information about the operation time
  const constraints = previousPlan
    ? getConstraints(previousPlan.planProd.data, planProd.data)
    : new Map<OperationConstraint, number>();
  const planOperations = splitOperations(operations, constraints);
  const {aideConducteur, conducteur, chauffePerfo, chauffeRefente} = planOperations;
  const operationsTotal =
    1000 *
    (max([aideConducteur, conducteur, chauffePerfo, chauffeRefente].map(split => split.total)) ||
      0);

  // Finish the plan prod
  schedulePerDay = finishPlanProd(
    schedulePerDay,
    planProd,
    operationsTotal,
    previousPlan,
    supportData
  );

  const startTimes = Array.from(schedulePerDay.values()).reduce(
    (times, schedule) => times.concat([schedule.start]),
    [] as number[]
  );
  const endTimes = Array.from(schedulePerDay.values()).reduce(
    (times, schedule) => times.concat([schedule.end]),
    [] as number[]
  );

  const minStart = startTimes.reduce((minTime, start) => Math.min(minTime, start), Date.now() * 2);
  const maxEnd = endTimes.reduce((maxTime, end) => Math.max(maxTime, end), 0);

  return {
    start: new Date(minStart),
    end: new Date(maxEnd),
    operations: planOperations,
    planProd,
    schedulePerDay,
  };
}

export function createSchedule(
  operations: Operation[],
  prodRanges: Map<string, ProdRange>,
  startedPlans: PlanProduction[],
  notStartedPlans: PlanProduction[],
  prods: Prod[],
  stops: Stop[],
  maintenances: Maintenance[],
  lastMinuteSpeed?: MinuteSpeed
): Schedule {
  // Remove startedPlans from the notStartedPlans array (happens when a plan is in progress)
  const allPlans = [...startedPlans, ...notStartedPlans];

  const prodsById = new Map<number, Prod[]>();
  const unassignedProds: Prod[] = [];

  const stopsById = new Map<number, Stop[]>();
  const unassignedStops: Stop[] = [];

  const automateEvents = new Map<number, PlanEvents>();
  const doneMaintenances = new Map<number, void>();

  prods.forEach(p => {
    if (p.planProdId === undefined) {
      unassignedProds.push(p);
    } else {
      const prodsForId = prodsById.get(p.planProdId);
      if (prodsForId === undefined) {
        prodsById.set(p.planProdId, [p]);
      } else {
        prodsForId.push(p);
      }
    }
  });
  stops.forEach(s => {
    if (s.planProdId === undefined) {
      unassignedStops.push(s);
    } else {
      const stopsForId = stopsById.get(s.planProdId);
      if (stopsForId === undefined) {
        stopsById.set(s.planProdId, [s]);
      } else {
        stopsForId.push(s);
      }
    }
    if (s.maintenanceId !== undefined && s.end !== undefined) {
      doneMaintenances.set(s.maintenanceId);
    }
  });
  allPlans.forEach(p => {
    automateEvents.set(p.id, {
      prods: prodsById.get(p.id) || [],
      stops: stopsById.get(p.id) || [],
      plannedProds: [],
      plannedStops: [],
    });
  });

  const notDoneMaintenances = maintenances.filter(m => !doneMaintenances.has(m.id));

  const supportData: ScheduleSupportData = {
    maintenances: notDoneMaintenances,
    prodRanges,
    currentTime: lastMinuteSpeed !== undefined ? lastMinuteSpeed.minute : Date.now(),
  };

  const sortedPlans = allPlans.sort((p1, p2) => {
    const future = Date.now() * 2;
    const p1ProdData = automateEvents.get(p1.id);
    const p2ProdData = automateEvents.get(p2.id);
    if (!p1ProdData || !p2ProdData) {
      return 0;
    }
    const p1FirstEvent = getFirstEvent(p1ProdData);
    const p2FirstEvent = getFirstEvent(p2ProdData);
    const p1Start = p1FirstEvent ? p1FirstEvent.start : future;
    const p2Start = p2FirstEvent ? p2FirstEvent.start : future;
    return p1Start < p2Start ? -1 : p2Start < p1Start ? 1 : p1.index - p2.index;
  });

  const scheduledPlans: ScheduledPlanProd[] = [];
  sortedPlans.forEach((plan, i) => {
    const previousPlan = scheduledPlans[scheduledPlans.length - 1];
    const planEvents = automateEvents.get(plan.id) || {
      prods: [],
      stops: [],
      plannedProds: [],
      plannedStops: [],
    };
    const nextPlan = sortedPlans[i + 1] as PlanProduction | undefined;
    let hasNextPlanStarted = false;
    if (nextPlan !== undefined) {
      const nextPlanEvents = automateEvents.get(nextPlan.id);
      hasNextPlanStarted =
        nextPlanEvents !== undefined &&
        (nextPlanEvents.stops.length > 0 || nextPlanEvents.prods.length > 0);
    }
    scheduledPlans.push(
      schedulePlanProd(operations, supportData, plan, planEvents, hasNextPlanStarted, previousPlan)
    );
  });

  return {lastMinuteSpeed, plans: scheduledPlans, unassignedProds, unassignedStops, maintenances};
}
