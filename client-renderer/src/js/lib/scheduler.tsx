import {max, min} from 'lodash-es';

import {ADDITIONAL_TIME_TO_RESTART_PROD, MAX_SPEED_RATIO} from '@root/lib/constants';
import {metersToProductionTime, productionTimeToMeters} from '@root/lib/plan_prod';
import {getConstraints, splitOperations} from '@root/lib/plan_prod_operation';
import {computeMetrage} from '@root/lib/prod';
import {isSameDay} from '@root/lib/utils';

import {getCurrentNonProd, getNextNonProd} from '@shared/lib/prod_hours';
import {dateAtHour, getWeekDay} from '@shared/lib/time';
import {endOfDay} from '@shared/lib/utils';
import {
  Operation,
  OperationConstraint,
  PlanProduction,
  Maintenance,
  ProdRange,
  Prod,
  Stop,
  Schedule,
  SpeedTime,
  AutomateEvent,
  ScheduledPlanProd,
  PlanProdSchedule,
  StopType,
  PlanProductionStatus,
  NonProd,
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
  nonProds: NonProd[];
  prodRanges: Map<string, ProdRange>;
  currentTime: number;
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
    if (event2.end === undefined) {
      return 0;
    } else {
      return 1;
    }
  }
}

function getFirstEvent<T extends AutomateEvent>(list: T[]): T | undefined {
  return list.sort(eventsOrder)[0];
}

function getLastEvent<T extends AutomateEvent>(list: T[]): T | undefined {
  return list.sort((e1, e2) => -eventsOrder(e1, e2))[0];
}

function getFirstPlanEvent(planEvents: PlanEvents): AutomateEvent | undefined {
  const minProd = getFirstEvent(planEvents.prods);
  const minPlannedProd = getFirstEvent(planEvents.plannedProds);
  const minStop = getFirstEvent(planEvents.stops);
  const minPlannedStop = getFirstEvent(planEvents.plannedStops);
  const mins = removeUndefined([minProd, minPlannedProd, minStop, minPlannedStop]);
  return getFirstEvent(mins);
}

function getLastPlanEvent(planEvents: PlanEvents): AutomateEvent | undefined {
  const maxProd = getLastEvent(planEvents.prods);
  const maxPlannedProd = getLastEvent(planEvents.plannedProds);
  const maxStop = getLastEvent(planEvents.stops);
  const maxPlannedStop = getLastEvent(planEvents.plannedStops);
  const maxs = removeUndefined([maxProd, maxPlannedProd, maxStop, maxPlannedStop]);
  return getLastEvent(maxs);
}

function getAllStopsOrdered(schedulePerDay: Map<number, PlanProdSchedule>): Stop[] {
  let stops: Stop[] = [];
  schedulePerDay.forEach(
    planSchedule => (stops = stops.concat(planSchedule.stops).concat(planSchedule.plannedStops))
  );
  return stops.sort(eventsOrder);
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

function getTotalOperationTimeDoneAndPlanned(
  schedulePerDay: Map<number, PlanProdSchedule>
): number {
  let total = 0;
  schedulePerDay.forEach(
    schedule => (total += schedule.doneOperationsMs + schedule.plannedOperationsMs)
  );
  return total;
}

function getTotalProdTimeDoneAndPlanned(schedulePerDay: Map<number, PlanProdSchedule>): number {
  let total = 0;
  schedulePerDay.forEach(schedule => (total += schedule.doneProdMs + schedule.plannedProdMs));
  return total;
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

function isNeutralStop(stop: Stop): boolean {
  return (
    stop.stopType === StopType.NotProdHours ||
    stop.stopType === StopType.Maintenance ||
    stop.stopType === undefined
  );
}

function isStartOfDay(currentSchedules: Map<number, PlanProdSchedule>, time: number): boolean {
  // It is the start of the day if the only events that day before the `time` are NonProd or Maintenance
  return (
    getAllStopsOrdered(currentSchedules)
      .filter(s => isSameDay(new Date(s.start), new Date(time)))
      .filter(isNeutralStop).length > 0
  );
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

function addNonProdEvents(
  currentSchedules: Map<number, PlanProdSchedule>,
  start: number,
  planProd: PlanProduction,
  nonProd: NonProd
): number {
  const nonProdSchedule = getOrCreateScheduleForTime(start, planProd, currentSchedules);
  nonProdSchedule.plannedStops.push({
    start,
    end: nonProd.end,
    planProdId: planProd.id,
    stopType: StopType.NotProdHours,
    title: nonProd.title,
  });
  return nonProd.end;
}

function applyNonProdIfNeeded(
  currentSchedules: Map<number, PlanProdSchedule>,
  planProd: PlanProduction,
  startTime: number,
  supportData: ScheduleSupportData
): number {
  let current = startTime;
  const date = new Date(current);
  const currentNonProd = getCurrentNonProd(date, supportData.prodRanges, supportData.nonProds);
  if (currentNonProd !== undefined) {
    // We are in a non prod zone, we create a NonProd stop associated with the plan.
    current = addNonProdEvents(currentSchedules, current, planProd, currentNonProd);
    // Call the function again, there might be more non prods coming
    return applyNonProdIfNeeded(currentSchedules, planProd, current, supportData);
  }
  return current;
}

function applyMaintenanceIfNeeded(
  currentSchedules: Map<number, PlanProdSchedule>,
  planProd: PlanProduction,
  currentTime: number,
  supportData: ScheduleSupportData
): number {
  const nextMaintenance = getCurrentMaintenance(currentTime, supportData.maintenances);
  if (nextMaintenance !== undefined) {
    // There is a maintenance scheduled, we remove it from the maintenance list
    // and generate the associated events
    supportData.maintenances = supportData.maintenances.filter(m => m.id !== nextMaintenance.id);
    const {start, end, id} = nextMaintenance;
    const duration = end - start;
    return generatePlannedEventsForStopLeft(
      currentSchedules,
      duration,
      {
        start,
        maintenanceId: id,
        planProdId: planProd.id,
        stopType: StopType.Maintenance,
      },
      currentTime,
      planProd,
      supportData
    );
  }
  return currentTime;
}

function lastValidConsecutiveFreeTime(time: number, supportData: ScheduleSupportData): number {
  const date = new Date(time);
  const currentNonProd = getCurrentNonProd(date, supportData.prodRanges, supportData.nonProds);
  if (currentNonProd !== undefined) {
    return time;
  }
  const currentMaintenance = getCurrentMaintenance(time, supportData.maintenances);
  if (currentMaintenance !== undefined) {
    return time;
  }
  const nextNonProd = getNextNonProd(date, supportData.prodRanges, supportData.nonProds);
  const nextMaintenance = getNextMaintenance(time, supportData.maintenances);
  const endOfDayTime = endOfDay(date).getTime();

  const possibleEndTimes = [endOfDayTime];
  if (nextNonProd) {
    possibleEndTimes.push(nextNonProd.start);
  }
  if (nextMaintenance) {
    possibleEndTimes.push(nextMaintenance.start);
  }
  return min(possibleEndTimes) || endOfDayTime;
}

function getNextMaintenance(time: number, maintenances: Maintenance[]): Maintenance | undefined {
  return maintenances.filter(
    m => m.start >= time && isSameDay(new Date(time), new Date(m.start))
  )[0];
}

function getCurrentMaintenance(time: number, maintenances: Maintenance[]): Maintenance | undefined {
  return maintenances.filter(
    m => m.start <= time && (m.end > time || isSameDay(new Date(time), new Date(m.start)))
  )[0];
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
        s =>
          s.stopType === StopType.ChangePlanProd ||
          s.stopType === StopType.ReprisePlanProd ||
          s.stopType === StopType.ReglagesAdditionel
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
): number {
  // Find the next valid prod time
  let current = applyNonProdIfNeeded(currentSchedules, planProd, startTime, supportData);
  current = applyMaintenanceIfNeeded(currentSchedules, planProd, current, supportData);
  // If there was no other prod this day and no ChangePlanProd or RepriseProd event
  // we need to add a RepriseProd event
  if (shouldCreateRestartProdStop(currentSchedules, current)) {
    current = generatePlannedEventsForStopLeft(
      currentSchedules,
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
    // Recursive call, we haven't done any prod yet
    return generatePlannedEventsForProdLeft(
      currentSchedules,
      metersToProduce,
      current,
      planProd,
      supportData
    );
  }

  // Check how far we can go in time
  const targetProdTime = metersToProductionTime(metersToProduce, planProd.data.speed, true);
  const targetEndTime = current + targetProdTime;
  const schedule = getOrCreateScheduleForTime(current, planProd, currentSchedules);
  const lastPossibleEndTime = lastValidConsecutiveFreeTime(current, supportData);
  const endTime = Math.min(targetEndTime, lastPossibleEndTime);
  // Add a planned prod up to the max we can go
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
    return generatePlannedEventsForProdLeft(
      currentSchedules,
      metersToProduce - actualProd,
      endTime,
      planProd,
      supportData
    );
  }
  return endTime;
}

function generatePlannedEventsForStopLeft(
  currentSchedules: Map<number, PlanProdSchedule>,
  stopLeft: number,
  stop: Stop,
  startTime: number,
  planProd: PlanProduction,
  supportData: ScheduleSupportData
): number {
  // Find the next valid operation time
  let current = applyNonProdIfNeeded(currentSchedules, planProd, startTime, supportData);
  current = applyMaintenanceIfNeeded(currentSchedules, planProd, current, supportData);

  // Special case, if we are trying to do a ChangePlanProd and that there is already
  // one for that plan, the stop becomes a ReglagesAdditionel.
  // Unless that event is the one just before, in that case we just leave it as is.
  if (stop.stopType === StopType.ChangePlanProd) {
    const allStops = getAllStopsOrdered(currentSchedules);
    const changePlanProdStops = allStops.filter(s => s.stopType === StopType.ChangePlanProd);
    if (
      changePlanProdStops.length > 0 &&
      changePlanProdStops[0].end !== undefined &&
      changePlanProdStops[0].end < current
    ) {
      stop = {...stop, stopType: StopType.ReglagesAdditionel};
    }
  }

  // Check how far we can go in time
  const targetEndTime = current + stopLeft;
  const schedule = getOrCreateScheduleForTime(current, planProd, currentSchedules);
  const lastPossibleEndTime = lastValidConsecutiveFreeTime(current, supportData);
  const endTime = Math.min(targetEndTime, lastPossibleEndTime);
  // Add a planned stop up to the max we can go
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
    return generatePlannedEventsForStopLeft(
      currentSchedules,
      stopLeft - (endTime - current),
      stop,
      endTime,
      planProd,
      supportData
    );
  }
  return endTime;
}

function generateChangePlanProd(
  currentSchedules: Map<number, PlanProdSchedule>,
  planProd: PlanProduction,
  operationTime: number,
  startTime: number,
  supportData: ScheduleSupportData
): number {
  let current = startTime;

  // If we need to pin to the start of the day, we create a NotProd event up to the next
  // free time, apply the non prod and maintenance, and try again.
  if (planProd.operationAtStartOfDay && !isStartOfDay(currentSchedules, startTime)) {
    const endTime = lastValidConsecutiveFreeTime(startTime, supportData);
    current = addNonProdEvents(currentSchedules, current, planProd, {
      id: -startTime,
      start: startTime,
      end: endTime,
      title: 'Réglage du prochain plan obligatoire en début de journée',
    });
    current = applyNonProdIfNeeded(currentSchedules, planProd, current, supportData);
    current = applyMaintenanceIfNeeded(currentSchedules, planProd, current, supportData);
    return generateChangePlanProd(currentSchedules, planProd, operationTime, current, supportData);
  }
  return generatePlannedEventsForStopLeft(
    currentSchedules,
    operationTime,
    {
      start: startTime,
      planProdId: planProd.id,
      stopType: StopType.ChangePlanProd,
    },
    startTime,
    planProd,
    supportData
  );
}

function generateProdLeft(
  currentSchedules: Map<number, PlanProdSchedule>,
  planProd: PlanProduction,
  startTime: number,
  supportData: ScheduleSupportData
): number {
  let current = startTime;

  // We don't finish the prod if there is a EndOfDayEndOfProd event
  const stopTypes = getAllStopsOrdered(currentSchedules).map(s => s.stopType);
  if (stopTypes.indexOf(StopType.EndOfDayEndProd) !== -1) {
    return startTime;
  }

  const prodAlreadyDoneMeters = getProdDoneMeters(currentSchedules);
  const prodLengthMeters = getProductionLengthMeters(planProd);
  const leftToProduce = prodLengthMeters - prodAlreadyDoneMeters;
  if (leftToProduce <= 0) {
    return startTime;
  }

  // If we need to pin to the start of the day, we create a NotProd event up to the next
  // free time, apply the non prod and maintenance, and try again.
  if (planProd.productionAtStartOfDay && !isStartOfDay(currentSchedules, startTime)) {
    const endTime = lastValidConsecutiveFreeTime(startTime, supportData);
    current = addNonProdEvents(currentSchedules, current, planProd, {
      id: -startTime,
      start: startTime,
      end: endTime,
      title: 'Production du prochain plan obligatoire en début de journée',
    });
    current = applyNonProdIfNeeded(currentSchedules, planProd, current, supportData);
    current = applyMaintenanceIfNeeded(currentSchedules, planProd, current, supportData);
    return generateProdLeft(currentSchedules, planProd, current, supportData);
  }
  return generatePlannedEventsForProdLeft(
    currentSchedules,
    leftToProduce,
    startTime,
    planProd,
    supportData
  );
}

function getStartTime(
  currentSchedules: Map<number, PlanProdSchedule>,
  previousPlan: ScheduledPlanProd | undefined,
  supportData: ScheduleSupportData
): number {
  const lastSchedule = getLastSchedule(currentSchedules);
  if (lastSchedule) {
    const lastPlanEvent = getLastPlanEvent(lastSchedule);
    if (lastPlanEvent) {
      return lastPlanEvent.end || supportData.currentTime;
    }
  }
  if (previousPlan) {
    const lastScheduleOfPreviousPlan = getLastSchedule(previousPlan.schedulePerDay);
    if (lastScheduleOfPreviousPlan) {
      const lastEventOfPreviousPlan = getLastPlanEvent(lastScheduleOfPreviousPlan);
      if (lastEventOfPreviousPlan) {
        return lastEventOfPreviousPlan.end || supportData.currentTime;
      }
    }
  }
  return supportData.currentTime;
}

function finishPlanProd(
  currentSchedules: Map<number, PlanProdSchedule>,
  planProd: PlanProduction,
  operationsTime: number,
  previousPlan: ScheduledPlanProd | undefined,
  supportData: ScheduleSupportData
): Map<number, PlanProdSchedule> {
  const lastSchedule = getLastSchedule(currentSchedules);
  // We only need to finish the plan if the last schedule is still in progress, or if there are no schedule
  // (plan has not started yet).
  if (lastSchedule && lastSchedule.status === PlanProductionStatus.DONE) {
    return currentSchedules;
  }

  // If there is something in progress we need to "finish" it first
  if (lastSchedule && lastSchedule.status === PlanProductionStatus.IN_PROGRESS) {
    // Finish the last stop
    const lastStopEvent = getLastEvent(lastSchedule.stops);
    if (lastStopEvent !== undefined && lastStopEvent.end === undefined) {
      const endTime = supportData.currentTime;
      const lastStopEventType = lastStopEvent.stopType;
      let stopLeft = 0;
      // ChangePlanProd & ReglagesAdditionel stop - Finish the operation time of the plan prod.
      if (
        lastStopEventType === StopType.ChangePlanProd ||
        lastStopEventType === StopType.ReglagesAdditionel
      ) {
        stopLeft = operationsTime - getTotalOperationTimeDone(currentSchedules);
      } else if (lastStopEventType === StopType.ReprisePlanProd) {
        stopLeft = ADDITIONAL_TIME_TO_RESTART_PROD - (endTime - lastStopEvent.start);
      } else if (isEndOfDayStop(lastStopEvent)) {
        const startDate = new Date(lastStopEvent.start);
        const endOfDayRange = supportData.prodRanges.get(getWeekDay(startDate));
        if (endOfDayRange) {
          stopLeft =
            dateAtHour(startDate, endOfDayRange.endHour, endOfDayRange.endMinute).getTime() -
            endTime;
        }
      } else if (lastStopEventType === StopType.EndOfDayPauseProd) {
        const startDate = new Date(lastStopEvent.start);
        const endOfDayRange = supportData.prodRanges.get(getWeekDay(startDate));
        if (endOfDayRange) {
          stopLeft =
            dateAtHour(startDate, endOfDayRange.endHour, endOfDayRange.endMinute).getTime() -
            endTime;
        }
      } else if (lastStopEventType === StopType.Maintenance) {
        if (lastStopEvent.maintenanceId !== undefined) {
          const maintenance = supportData.maintenances.filter(
            m => m.id === lastStopEvent.maintenanceId
          )[0];
          if (maintenance) {
            stopLeft = maintenance.end - maintenance.start - (endTime - lastStopEvent.start);
          }
          supportData.maintenances = supportData.maintenances.filter(
            m => m.id !== lastStopEvent.maintenanceId
          );
        }
      }
      lastStopEvent.end = endTime;

      if (lastStopEventType !== undefined && stopLeft > 0) {
        generatePlannedEventsForStopLeft(
          currentSchedules,
          stopLeft,
          {
            start: 0,
            planProdId: lastStopEvent.planProdId,
            maintenanceId: lastStopEvent.maintenanceId,
            stopType: lastStopEventType,
          },
          endTime,
          planProd,
          supportData
        );
      }

      if (lastStopEventType === StopType.EndOfDayEndProd) {
        return currentSchedules;
      }
      // If we haven't finished the operation time and haven't started the prod, we generate
      // ReglagesAdditionel stop to finish it.
      const operationsLeft = operationsTime - getTotalOperationTimeDoneAndPlanned(currentSchedules);
      const totalProdTimeDoneAndPlanned = getTotalProdTimeDoneAndPlanned(currentSchedules);
      if (operationsLeft > 0 && totalProdTimeDoneAndPlanned <= 0) {
        generatePlannedEventsForStopLeft(
          currentSchedules,
          operationsLeft,
          {
            start: 0,
            planProdId: planProd.id,
            stopType: StopType.ReglagesAdditionel,
          },
          getStartTime(currentSchedules, previousPlan, supportData),
          planProd,
          supportData
        );
      }
    }

    // Finish the last prod if still in progress
    const lastProdEvent = getLastEvent(lastSchedule.prods);
    if (lastProdEvent !== undefined && lastProdEvent.end === undefined) {
      const endTime = getStartTime(currentSchedules, previousPlan, supportData);
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
    generateChangePlanProd(
      currentSchedules,
      planProd,
      operationsTime,
      getStartTime(currentSchedules, previousPlan, supportData),
      supportData
    );
  }

  // Now we can finish the prod.
  generateProdLeft(
    currentSchedules,
    planProd,
    getStartTime(currentSchedules, previousPlan, supportData),
    supportData
  );

  return currentSchedules;
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
        scheduleForEvent.doneProdMs += prodTime;
        scheduleForEvent.doneProdMeters += prodMeters;
      }
      scheduleForEvent.prods.push(prodEvent);
    } else {
      const stopEvent = event as Stop;
      if (
        stopEvent.stopType &&
        (stopEvent.stopType === StopType.ChangePlanProd ||
          stopEvent.stopType === StopType.ReglagesAdditionel)
      ) {
        scheduleForEvent.doneOperationsMs += getEventDuration(stopEvent, supportData.currentTime);
      }
      scheduleForEvent.stops.push(stopEvent);
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
    const lastEvent = getLastPlanEvent(lastSchedule);
    if (
      (endOfDayEndProdStops.length === 0 && endOfDayPauseProdStops.length === 0) ||
      (lastEvent && lastEvent.end === undefined)
    ) {
      lastSchedule.status = PlanProductionStatus.IN_PROGRESS;
    } else {
      // If there is still some prod left (without a EndOfDayEndProd event), we need
      // to create an empty IN_PROGRESS schedule for the next day that we'll complete later.
      const prodLeft = getProductionLengthMeters(planProd) - getProdDoneMeters(schedulePerDay);
      if (endOfDayEndProdStops.length === 0 && prodLeft > 0) {
        const nextSchedule = lastEvent
          ? getOrCreateScheduleForTime(
              endOfDay(new Date(lastEvent.start)).getTime(),
              planProd,
              schedulePerDay
            )
          : lastSchedule;
        nextSchedule.status = PlanProductionStatus.IN_PROGRESS;
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

  return {
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
  nonProds: NonProd[],
  lastSpeedTime?: SpeedTime
): Schedule {
  // Remove startedPlans from the notStartedPlans array (happens when a plan is in progress)
  const allPlans = [...startedPlans, ...notStartedPlans];
  const originalStops = stops.map(s => ({...s}));

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
    nonProds,
    currentTime: lastSpeedTime !== undefined ? lastSpeedTime.time : Date.now(),
  };

  const sortedPlans = allPlans.sort((p1, p2) => {
    const future = Date.now() * 2;
    const p1ProdData = automateEvents.get(p1.id);
    const p2ProdData = automateEvents.get(p2.id);
    if (!p1ProdData || !p2ProdData) {
      return 0;
    }
    const p1FirstEvent = getFirstPlanEvent(p1ProdData);
    const p2FirstEvent = getFirstPlanEvent(p2ProdData);
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

  return {
    lastSpeedTime,
    plans: scheduledPlans,
    unassignedProds,
    unassignedStops,
    maintenances,
    nonProds,
    prodHours: prodRanges,
    stops: originalStops,
  };
}
