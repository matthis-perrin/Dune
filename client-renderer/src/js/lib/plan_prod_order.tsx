import {max, maxBy} from 'lodash-es';

import {PROD_HOURS_BY_DAY, ProdRange, ADDITIONAL_TIME_TO_RESTART_PROD} from '@root/lib/constants';
import {OperationSplits, getConstraints, splitOperations} from '@root/lib/plan_prod_operation';
import {dateIsAfterOrSameDay, dateIsBeforeOrSameDay} from '@root/lib/utils';

import {Operation, PlanProduction, NonProd} from '@shared/models';

export type PlanProdType = 'done' | 'in-progress' | 'scheduled';

export interface PlanProdBase {
  plan: PlanProduction;
  operations?: OperationSplits;
  operationsTotal: number;
  prodLength: number;
  type: PlanProdType;
}

export interface DonePlanProduction extends PlanProdBase {
  start: Date;
  end: Date;
}

export interface InProgressPlanProduction extends PlanProdBase {
  start: Date;
  scheduledEnd: Date;
}

export interface ScheduledPlanProduction extends PlanProdBase {
  estimatedReglageStart: Date;
  estimatedReglageEnd: Date;
  estimatedProductionStart: Date;
  estimatedProductionEnd: Date;
}

export interface PlansProdOrder {
  done: DonePlanProduction[];
  inProgress?: InProgressPlanProduction;
  scheduled: ScheduledPlanProduction[];
}

const MAX_SPEED_RATIO = 0.82;

function getProductionLengthMs(planProd: PlanProduction): number {
  const {bobines, speed, tourCount} = planProd.data;
  const actualSpeed = MAX_SPEED_RATIO * speed;
  const bobineLength = bobines.length > 0 ? bobines[0].longueur || 0 : 0;
  const lengthToProduce = tourCount * bobineLength;
  const productionTimeMs = Math.round((lengthToProduce / actualSpeed) * 60) * 1000;
  return productionTimeMs;
}

function dateAt(date: Date, hour: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour);
}

function startOfNextDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
}

function differentDay(date1: Date, date2: Date): boolean {
  return (
    date1.getDate() !== date2.getDate() ||
    date1.getMonth() !== date2.getMonth() ||
    date1.getFullYear() !== date2.getFullYear()
  );
}

function prodRangeAsDate(currentDate: Date, prodRange: ProdRange): {start: Date; end: Date} {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const day = currentDate.getDate();
  const start = new Date(year, month, day, prodRange.startHour, prodRange.startMinute);
  const end = new Date(year, month, day, prodRange.endHour, prodRange.endMinute);
  return {start, end};
}

function adjustTimeWithNonPros(time: number, nonProds: NonProd[]): number {
  const matchingNonProds = nonProds.filter(
    nonProd => time >= nonProd.startTime && time < nonProd.endTime
  );
  const latestNonProd = maxBy(matchingNonProds, 'endTime');
  if (latestNonProd) {
    return adjustTimeWithNonPros(latestNonProd.endTime, nonProds);
  }
  return time;
}

function adjustTimeLeftWithNonProds(start: number, timeLeft: number, nonProds: NonProd[]): number {
  const adjustedStart = adjustTimeWithNonPros(start, nonProds);
  const matchingNonProds = nonProds.filter(
    nonProd => nonProd.startTime > start && nonProd.startTime < start + timeLeft
  );
  const latestNonProd = maxBy(matchingNonProds, 'endTime');
  if (latestNonProd) {
    const consumedTimeByNonProd =
      Math.min(adjustedStart + timeLeft, latestNonProd.endTime) -
      Math.max(adjustedStart, latestNonProd.startTime);
    const newTimeLeft = timeLeft + consumedTimeByNonProd;
    return adjustTimeLeftWithNonProds(latestNonProd.endTime, newTimeLeft, nonProds);
  }
  return timeLeft;
}

function advanceToNextProdDate(date: Date, nonProds: NonProd[]): Date {
  const ts = date.getTime();
  const dayOfWeek = date.toLocaleString('fr-FR', {weekday: 'long'});
  const prodHours = PROD_HOURS_BY_DAY.get(dayOfWeek);
  if (!prodHours) {
    return advanceToNextProdDate(startOfNextDay(date), nonProds);
  }

  const {start, end} = prodRangeAsDate(date, prodHours);

  if (ts >= end.getTime()) {
    return advanceToNextProdDate(startOfNextDay(date), nonProds);
  }
  const adjustedTimeWithStart = ts < start.getTime() ? start.getTime() : ts;
  const adjustedTimeWithNonProds = adjustTimeWithNonPros(adjustedTimeWithStart, nonProds);
  const adjustedDate = new Date(adjustedTimeWithNonProds);
  if (adjustedTimeWithNonProds !== adjustedTimeWithStart) {
    return advanceToNextProdDate(adjustedDate, nonProds);
  }
  return adjustedDate;
}

function advanceProdDate(date: Date, time: number, nonProds: NonProd[], stopDate?: Date): Date {
  const current = advanceToNextProdDate(date, nonProds);
  const dayOfWeek = current.toLocaleString('fr-FR', {weekday: 'long'});
  const prodHours = PROD_HOURS_BY_DAY.get(dayOfWeek);
  if (!prodHours) {
    throw new Error(`${current.toLocaleDateString('fr')} n'est pas un temps de prod valide.`);
  }

  const {end} = prodRangeAsDate(current, prodHours);
  const endTime = stopDate !== undefined ? stopDate.getTime() : end.getTime();
  const timeLeft = endTime - current.getTime();
  const adjustedTimeLeft = adjustTimeLeftWithNonProds(current.getTime(), timeLeft, nonProds);
  if (adjustedTimeLeft < time) {
    current.setDate(current.getDate() + 1);
    return advanceProdDate(dateAt(current, 0), time - adjustedTimeLeft, nonProds);
  }
  return new Date(current.getTime() + time);
}

function pinToStartOfDay(date: Date, nonProds: NonProd[]): Date {
  const ts = date.getTime();
  const dayOfWeek = date.toLocaleString('fr-FR', {weekday: 'long'});
  const prodHours = PROD_HOURS_BY_DAY.get(dayOfWeek);
  if (!prodHours) {
    return advanceToNextProdDate(startOfNextDay(date), nonProds);
  }
  const {start} = prodRangeAsDate(date, prodHours);
  if (ts < start.getTime()) {
    return advanceToNextProdDate(start, nonProds);
  }
  if (ts === start.getTime()) {
    return advanceToNextProdDate(date, nonProds);
  }
  return advanceToNextProdDate(startOfNextDay(date), nonProds);
}

function getPlanProdBase(
  type: PlanProdType,
  operations: Operation[],
  planProd: PlanProduction,
  previous?: PlanProduction
): PlanProdBase {
  const prodLength = getProductionLengthMs(planProd);
  if (!previous) {
    return {
      plan: planProd,
      operationsTotal: 0,
      prodLength,
      type,
    };
  }
  const constraints = getConstraints(previous.data, planProd.data);
  const planOperations = splitOperations(operations, constraints);
  const {aideConducteur, conducteur, chauffePerfo, chauffeRefente} = planOperations;
  const operationsTotal =
    1000 *
    (max([aideConducteur, conducteur, chauffePerfo, chauffeRefente].map(split => split.total)) ||
      0);

  return {plan: planProd, operations: planOperations, operationsTotal, prodLength, type};
}

export function orderPlansProd(
  plansProd: PlanProduction[],
  operations: Operation[],
  nonProds: NonProd[]
): PlansProdOrder {
  const donePlansProd = plansProd
    .filter(p => p.startTime && p.endTime)
    .sort((p1, p2) => (p1.startTime || 0) - (p2.startTime || 0));
  const inProgressPlansProd = plansProd
    .filter(p => p.startTime && !p.endTime)
    .sort((p1, p2) => (p1.startTime || 0) - (p2.startTime || 0));
  const scheduledPlansProd = plansProd
    .filter(p => !p.startTime && !p.endTime)
    .sort((p1, p2) => (p1.index || 0) - (p2.index || 0));

  const done = donePlansProd.map((p, index) => {
    const base = getPlanProdBase(
      'done',
      operations,
      p,
      index > 0 ? donePlansProd[index - 1] : undefined
    );
    return {
      ...base,
      start: new Date(p.startTime || Date.now()),
      end: new Date(p.endTime || Date.now()),
    };
  });
  const lastDone = donePlansProd.length > 0 ? donePlansProd[donePlansProd.length - 1] : undefined;

  let startingPoint = advanceToNextProdDate(new Date(), nonProds);

  let inProgress: InProgressPlanProduction | undefined;
  if (inProgressPlansProd.length > 0) {
    const firstInProgress = inProgressPlansProd[0];
    const base = getPlanProdBase('in-progress', operations, firstInProgress, lastDone);
    const inProgressStart = new Date(firstInProgress.startTime || Date.now());
    let scheduledEnd = advanceProdDate(
      inProgressStart,
      base.operationsTotal + base.prodLength,
      nonProds,
      firstInProgress.stopTime === undefined ? undefined : new Date(firstInProgress.stopTime)
    );
    if (differentDay(inProgressStart, scheduledEnd)) {
      scheduledEnd = advanceProdDate(scheduledEnd, ADDITIONAL_TIME_TO_RESTART_PROD, nonProds);
    }
    startingPoint = scheduledEnd;
    inProgress = {...base, start: inProgressStart, scheduledEnd};
  }

  let previousScheduled = inProgressPlansProd[0] || lastDone;
  const scheduled = scheduledPlansProd.map(p => {
    const base = getPlanProdBase('scheduled', operations, p, previousScheduled);
    const {operationAtStartOfDay, productionAtStartOfDay} = p;
    const estimatedReglageStart = operationAtStartOfDay
      ? pinToStartOfDay(startingPoint, nonProds)
      : startingPoint;
    const estimatedReglageEnd = advanceProdDate(
      estimatedReglageStart,
      base.operationsTotal,
      nonProds
    );
    const estimatedProductionStart = productionAtStartOfDay
      ? pinToStartOfDay(estimatedReglageEnd, nonProds)
      : estimatedReglageEnd;
    let estimatedProductionEnd = advanceProdDate(
      estimatedProductionStart,
      base.prodLength,
      nonProds
    );
    if (differentDay(estimatedProductionStart, estimatedProductionEnd)) {
      estimatedProductionEnd = advanceProdDate(
        estimatedProductionEnd,
        ADDITIONAL_TIME_TO_RESTART_PROD,
        nonProds
      );
    }
    startingPoint = estimatedProductionEnd;
    previousScheduled = p;
    return {
      ...base,
      estimatedReglageStart,
      estimatedReglageEnd,
      estimatedProductionStart,
      estimatedProductionEnd,
    };
  });

  return {done, inProgress, scheduled};
}

export function getPlanProdsForDate(plansProdOrder: PlansProdOrder, date: Date): PlansProdOrder {
  const done = plansProdOrder.done.filter(
    p =>
      dateIsAfterOrSameDay(date, new Date(p.plan.startTime || 0)) &&
      dateIsBeforeOrSameDay(date, new Date(p.plan.endTime || 0))
  );
  const inProgress =
    plansProdOrder.inProgress &&
    dateIsAfterOrSameDay(date, new Date(plansProdOrder.inProgress.plan.startTime || 0)) &&
    dateIsBeforeOrSameDay(date, plansProdOrder.inProgress.scheduledEnd)
      ? plansProdOrder.inProgress
      : undefined;
  const scheduled = plansProdOrder.scheduled.filter(
    p =>
      dateIsAfterOrSameDay(date, p.estimatedReglageStart) &&
      dateIsBeforeOrSameDay(date, p.estimatedProductionEnd)
  );
  return {done, inProgress, scheduled};
}
