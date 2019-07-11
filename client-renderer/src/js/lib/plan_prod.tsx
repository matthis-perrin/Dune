import {zip, max} from 'lodash-es';

import {padNumber} from '@root/lib/utils';

import {getPoseSize} from '@shared/lib/cliches';
import {EncrierColor} from '@shared/lib/encrier';
import {getRefenteLaizes} from '@shared/lib/refentes';
import {
  Perfo,
  OperationConstraint,
  Refente,
  BobineMere,
  BobineFilleWithPose,
  OperationGroup,
  Operation,
  PlanProductionInfo,
  PlanProduction,
} from '@shared/models';

export const PLAN_PROD_NUMBER_DIGIT_COUNT = 5;

export function getPlanProdTitle(id: number): string {
  return `PRODUCTION N°${padNumber(id, PLAN_PROD_NUMBER_DIGIT_COUNT)}`;
}

export interface PlanProdStateLight {
  perfo: Perfo;
  refente: Refente;
  papier: BobineMere;
  polypro: BobineMere;
  encriers: EncrierColor[];
  bobines: BobineFilleWithPose[];
}

export function countChangementPerforation(
  before: PlanProdStateLight,
  after: PlanProdStateLight
): number {
  return before.perfo.ref !== after.perfo.ref ? 1 : 0;
}

export function countChangementRefente(
  before: PlanProdStateLight,
  after: PlanProdStateLight
): number {
  return before.refente.ref !== after.refente.ref ? 1 : 0;
}

export function countChangementBobinesMerePapier(
  before: PlanProdStateLight,
  after: PlanProdStateLight
): number {
  return before.papier.ref !== after.papier.ref ? 1 : 0;
}

export function countChangementBobinesMerePolypro(
  before: PlanProdStateLight,
  after: PlanProdStateLight
): number {
  return before.polypro.ref !== after.polypro.ref ? 1 : 0;
}

function getClicheEncrierIndexes(
  refCliche: string,
  encriers: EncrierColor[]
): {index: number; color: string}[] {
  const indexes: {index: number; color: string}[] = [];
  encriers.forEach((encrier, index) => {
    if (encrier.refsCliche.indexOf(refCliche) !== -1) {
      indexes.push({index, color: encrier.color});
    }
  });
  return indexes;
}

interface ClichePosition {
  encrierIndex: number;
  color: string;
  distance: number;
}

function makeClichePosePositions(
  bobines: BobineFilleWithPose[],
  encriers: EncrierColor[]
): Map<string, ClichePosition[]> {
  const clichePosePositions = new Map<string, ClichePosition[]>();
  let distance = 0;
  bobines.forEach(b => {
    const {refCliche1, refCliche2, pose} = b;
    const poseSize = getPoseSize(pose);
    const processCliche = (clicheRef?: string): void => {
      if (clicheRef) {
        const indexes = getClicheEncrierIndexes(clicheRef, encriers);
        indexes.forEach(({index, color}) => {
          const clichePose = `${clicheRef}_${poseSize}`;
          const positions = clichePosePositions.get(clichePose);
          if (!positions) {
            clichePosePositions.set(clichePose, [{encrierIndex: index, color, distance}]);
          } else {
            positions.push({encrierIndex: index, color, distance});
          }
        });
      }
    };
    processCliche(refCliche1);
    processCliche(refCliche2);
    distance += (b.laize || 0) * poseSize;
  });
  return clichePosePositions;
}

function hasPosition(positions: ClichePosition[], position: ClichePosition): boolean {
  for (const p of positions) {
    if (
      position.color === p.color &&
      position.distance === p.distance &&
      position.encrierIndex === p.encrierIndex
    ) {
      return true;
    }
  }
  return false;
}

export function countClicheDiff(before: PlanProdStateLight, after: PlanProdStateLight): number {
  const beforeClichePosePositions = makeClichePosePositions(before.bobines, before.encriers);
  const afterClichePosePositions = makeClichePosePositions(after.bobines, after.encriers);

  let retraitClicheCount = 0;
  beforeClichePosePositions.forEach((positions, clichePose) => {
    positions.forEach(position => {
      const afterPositions = afterClichePosePositions.get(clichePose);
      if (!afterPositions || !hasPosition(afterPositions, position)) {
        retraitClicheCount++;
        return;
      }
    });
  });

  return retraitClicheCount;
}

export function countChangementsCouleurs(
  before: PlanProdStateLight,
  after: PlanProdStateLight
): {vidage: number; remplissage: number} {
  const beforeCouleurs = before.encriers.map(({color}) => color);
  const afterCouleurs = after.encriers.map(({color}) => color);
  let vidage = 0;
  let remplissage = 0;
  zip(beforeCouleurs, afterCouleurs).forEach(([beforeCouleur, afterCouleur]) => {
    if (beforeCouleur === '' && afterCouleur !== '') {
      remplissage++;
    }
    if (beforeCouleur !== '' && afterCouleur === '') {
      vidage++;
    }
    if (beforeCouleur !== '' && afterCouleur !== '' && beforeCouleur !== afterCouleur) {
      remplissage++;
      vidage++;
    }
  });
  return {vidage, remplissage};
}

function convertPosePositionsToPositionsByDistance(
  posePositions: Map<string, ClichePosition[]>
): Map<number, string[]> {
  const positionsByDistance = new Map<number, string[]>();
  posePositions.forEach((positions, clichePose) => {
    positions.forEach(position => {
      const positionsForDistance = positionsByDistance.get(position.distance);
      const additionalPosition = `${position.encrierIndex}_${position.color}_${clichePose}`;
      if (!positionsForDistance) {
        positionsByDistance.set(position.distance, [additionalPosition]);
      } else {
        positionsForDistance.push(additionalPosition);
      }
    });
  });
  return positionsByDistance;
}

export function countNewMultiCouleursCliches(
  before: PlanProdStateLight,
  after: PlanProdStateLight
): number {
  const beforeClichePosePositions = makeClichePosePositions(before.bobines, before.encriers);
  const afterClichePosePositions = makeClichePosePositions(after.bobines, after.encriers);
  const beforePositionsByDistance = convertPosePositionsToPositionsByDistance(
    beforeClichePosePositions
  );
  const afterPositionsByDistance = convertPosePositionsToPositionsByDistance(
    afterClichePosePositions
  );

  let newMultiCouleursClichesCount = 0;
  afterPositionsByDistance.forEach((positions, distance) => {
    const beforePositionsForDistance = beforePositionsByDistance.get(distance) || [];
    const alreadyHereCount = positions.filter(p => beforePositionsForDistance.indexOf(p) !== -1)
      .length;
    const extraMultiCouleursCount = positions.length - Math.max(alreadyHereCount - 1, 0) - 1;
    newMultiCouleursClichesCount += extraMultiCouleursCount;
  });
  return newMultiCouleursClichesCount;
}

export function countIncreaseRefenteCount(
  before: PlanProdStateLight,
  after: PlanProdStateLight
): number {
  return getRefenteLaizes(before.refente).length < getRefenteLaizes(after.refente).length ? 1 : 0;
}

export function getConstraints(
  before: PlanProdStateLight,
  after: PlanProdStateLight
): Map<OperationConstraint, number> {
  const constraints = new Map<OperationConstraint, number>();
  constraints.set(OperationConstraint.None, 1);
  constraints.set(
    OperationConstraint.ChangementPerforation,
    countChangementPerforation(before, after)
  );
  constraints.set(OperationConstraint.ChangementRefente, countChangementRefente(before, after));
  constraints.set(
    OperationConstraint.ChangementBobinesMerePapier,
    countChangementBobinesMerePapier(before, after)
  );
  constraints.set(
    OperationConstraint.ChangementBobinesMerePolypro,
    countChangementBobinesMerePolypro(before, after)
  );
  constraints.set(OperationConstraint.RetraitCliche, countClicheDiff(before, after));
  constraints.set(OperationConstraint.AjoutCliche, countClicheDiff(after, before));
  const {vidage, remplissage} = countChangementsCouleurs(before, after);
  constraints.set(OperationConstraint.VidageEncrier, vidage);
  constraints.set(OperationConstraint.RemplissageEncrier, remplissage);
  constraints.set(
    OperationConstraint.AugmentationRefentes,
    countIncreaseRefenteCount(before, after)
  );
  constraints.set(
    OperationConstraint.ClicheMultiCouleurs,
    countNewMultiCouleursCliches(before, after)
  );

  return constraints;
}

interface OperationDetail {
  description: string;
  constraint: OperationConstraint;
  quantity: number;
  duration: number;
}

export interface OperationSplit {
  total: number;
  operations: OperationDetail[];
}

interface OperationSplits {
  conducteur: OperationSplit;
  aideConducteur: OperationSplit;
  chauffePerfo: OperationSplit;
  chauffeRefente: OperationSplit;
}

export function splitOperations(
  operations: Operation[],
  constraints: Map<OperationConstraint, number>
): OperationSplits {
  const conducteurSplit: OperationSplit = {total: 0, operations: []};
  const aideConducteurSplit: OperationSplit = {total: 0, operations: []};

  const conducteurOperations = operations.filter(o => o.group === OperationGroup.Conducteur);
  const aideConducteurOperations = operations
    .filter(o => o.group === OperationGroup.Aide)
    .sort((o1, o2) => {
      const o1Quantity = constraints.get(o1.constraint) || 0;
      const o2Quantity = constraints.get(o2.constraint) || 0;
      return o2Quantity * o2.duration - o1Quantity * o1.duration;
    });
  const repartissableOperations = operations.filter(o => o.group === OperationGroup.Repartissable);

  conducteurOperations.forEach(o => {
    const quantity = constraints.get(o.constraint) || 0;
    if (quantity > 0) {
      conducteurSplit.total += o.duration * quantity;
      conducteurSplit.operations.push({
        description: o.description,
        constraint: o.constraint,
        quantity,
        duration: o.duration,
      });
    }
  });

  aideConducteurOperations.forEach(o => {
    const quantity = constraints.get(o.constraint) || 0;
    if (quantity > 0) {
      const operationDetail = {
        description: o.description,
        constraint: o.constraint,
        quantity,
        duration: o.duration,
      };
      if (conducteurSplit.total < aideConducteurSplit.total) {
        conducteurSplit.total += o.duration * quantity;
        conducteurSplit.operations.push(operationDetail);
      } else {
        aideConducteurSplit.total += o.duration * quantity;
        aideConducteurSplit.operations.push(operationDetail);
      }
    }
  });

  repartissableOperations.forEach(o => {
    const quantity = constraints.get(o.constraint) || 0;
    if (quantity > 0) {
      const operationDetail = {
        description: o.description,
        constraint: o.constraint,
        quantity,
        duration: o.duration,
      };
      const duration = o.duration * quantity;
      const diffBetweenOperators = aideConducteurSplit.total - conducteurSplit.total;
      if (diffBetweenOperators > duration / 2) {
        conducteurSplit.total += duration;
        conducteurSplit.operations.push(operationDetail);
      } else if (diffBetweenOperators < -duration / 2) {
        aideConducteurSplit.total += duration;
        aideConducteurSplit.operations.push(operationDetail);
      } else {
        const splittedOperationDetail = {...operationDetail, quantity: quantity / 2};
        conducteurSplit.total += duration / 2;
        conducteurSplit.operations.push(splittedOperationDetail);
        aideConducteurSplit.total += duration / 2;
        aideConducteurSplit.operations.push(splittedOperationDetail);
      }
    }
  });

  const chauffeRefenteSplit: OperationSplit = {total: 0, operations: []};
  operations
    .filter(o => o.group === OperationGroup.ChauffeRefente)
    .forEach(o => {
      const quantity = constraints.get(o.constraint) || 0;
      if (quantity > 0) {
        chauffeRefenteSplit.total += quantity * o.duration;
        chauffeRefenteSplit.operations.push({
          constraint: o.constraint,
          description: o.description,
          duration: o.duration,
          quantity,
        });
      }
    });

  const chauffePerfoSplit: OperationSplit = {total: 0, operations: []};
  operations
    .filter(o => o.group === OperationGroup.ChauffePerfo)
    .forEach(o => {
      const quantity = constraints.get(o.constraint) || 0;
      if (quantity > 0) {
        chauffePerfoSplit.total += quantity * o.duration;
        chauffePerfoSplit.operations.push({
          constraint: o.constraint,
          description: o.description,
          duration: o.duration,
          quantity,
        });
      }
    });

  return {
    conducteur: conducteurSplit,
    aideConducteur: aideConducteurSplit,
    chauffePerfo: chauffePerfoSplit,
    chauffeRefente: chauffeRefenteSplit,
  };
}

export function getOperationTime(
  operations: Operation[],
  before: PlanProdStateLight,
  after: PlanProdStateLight
): number {
  const constraints = getConstraints(before, after);
  const operationsSplits = splitOperations(operations, constraints);
  const {aideConducteur, conducteur, chauffePerfo, chauffeRefente} = operationsSplits;
  return (
    max([aideConducteur, conducteur, chauffePerfo, chauffeRefente].map(split => split.total)) || 0
  );
}

export function getPreviousPlanProd(
  current: PlanProductionInfo,
  allPlansProd: PlanProduction[]
): PlanProduction | undefined {
  const currentIndex = current.index;
  if (currentIndex !== undefined) {
    if (currentIndex === 0) {
      return allPlansProd
        .filter(p => p.startTime !== undefined)
        .sort((p1, p2) => (p2.startTime || 0) - (p1.startTime || 0))[0];
    }
    return allPlansProd.filter(p => p.index === currentIndex - 1)[0];
  }
  const currentStartTime = current.startTime || 0;
  return allPlansProd
    .filter(p => p.startTime !== undefined && p.startTime < currentStartTime)
    .sort((p1, p2) => (p2.startTime || 0) - (p1.startTime || 0))[0];
}

export interface PlanProdBase {
  plan: PlanProduction;
}

export interface NotDoneBase extends PlanProdBase {
  operations?: OperationSplits;
  operationsTotal: number;
  prodLength: number;
}

export interface DonePlanProduction extends PlanProdBase {}

export interface InProgressPlanProduction extends NotDoneBase {
  scheduledEnd: Date;
}

export interface ScheduledPlanProduction extends NotDoneBase {
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

interface ProdRange {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

function prodRangeAsDate(currentDate: Date, prodRange: ProdRange): {start: Date; end: Date} {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const day = currentDate.getDay();
  const start = new Date(year, month, day, prodRange.startHour, prodRange.startMinute);
  const end = new Date(year, month, day, prodRange.endHour, prodRange.endMinute);
  return {start, end};
}

const PROD_HOUR_BY_DAY = new Map<string, ProdRange>([
  ['lundi', {startHour: 6, startMinute: 0, endHour: 22, endMinute: 0}],
  ['mardi', {startHour: 6, startMinute: 0, endHour: 22, endMinute: 0}],
  ['mercredi', {startHour: 6, startMinute: 0, endHour: 22, endMinute: 0}],
  ['jeudi', {startHour: 6, startMinute: 0, endHour: 22, endMinute: 0}],
  ['vendredi', {startHour: 6, startMinute: 0, endHour: 19, endMinute: 0}],
]);

function advanceToNextProdDate(date: Date): Date {
  const ts = date.getTime();
  const dayOfWeek = date.toLocaleString('fr-FR', {weekday: 'long'});
  const prodHours = PROD_HOUR_BY_DAY.get(dayOfWeek);
  if (!prodHours) {
    return advanceToNextProdDate(startOfNextDay(date));
  }

  const {start, end} = prodRangeAsDate(date, prodHours);
  if (ts < start.getTime()) {
    return start;
  }
  if (ts < end.getTime()) {
    return date;
  }

  return advanceToNextProdDate(startOfNextDay(date));
}

function advanceProdDate(date: Date, time: number): Date {
  const current = advanceToNextProdDate(date);
  const dayOfWeek = current.toLocaleString('fr-FR', {weekday: 'long'});
  const prodHours = PROD_HOUR_BY_DAY.get(dayOfWeek);
  if (!prodHours) {
    throw new Error(`${current.toLocaleDateString('fr')} n'est pas un temps de prod valide.`);
  }

  const {end} = prodRangeAsDate(current, prodHours);
  const timeLeft = end.getTime() - end.getTime();
  if (timeLeft < time) {
    current.setDate(current.getDate() + 1);
    return advanceProdDate(dateAt(current, 0), time - timeLeft);
  }
  return new Date(current.getTime() + time);
}

function getPlanProdBase(
  operations: Operation[],
  planProd: PlanProduction,
  previous?: PlanProduction
): NotDoneBase {
  const prodLength = getProductionLengthMs(planProd);
  if (!previous) {
    return {
      plan: planProd,
      operationsTotal: 0,
      prodLength,
    };
  }
  const constraints = getConstraints(previous.data, planProd.data);
  const planOperations = splitOperations(operations, constraints);
  const {aideConducteur, conducteur, chauffePerfo, chauffeRefente} = planOperations;
  const operationsTotal =
    max([aideConducteur, conducteur, chauffePerfo, chauffeRefente].map(split => split.total)) || 0;

  return {plan: planProd, operations: planOperations, operationsTotal, prodLength};
}

export function orderPlansProd(
  plansProd: PlanProduction[],
  operations: Operation[]
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

  const done = donePlansProd.map(p => ({plan: p}));
  const lastDone = donePlansProd.length > 0 ? donePlansProd[donePlansProd.length - 1] : undefined;

  let startingPoint = advanceToNextProdDate(new Date());

  let inProgress: InProgressPlanProduction | undefined;
  if (inProgressPlansProd.length > 0) {
    const firstInProgress = inProgressPlansProd[0];
    const base = getPlanProdBase(operations, firstInProgress, lastDone);
    const scheduledEnd = advanceProdDate(
      new Date(firstInProgress.startTime || Date.now()),
      base.operationsTotal + base.prodLength
    );
    startingPoint = scheduledEnd;
    inProgress = {...base, scheduledEnd};
  }

  const previousScheduled = inProgressPlansProd[0] || lastDone;
  const scheduled = scheduledPlansProd.map(p => {
    const base = getPlanProdBase(operations, p, previousScheduled);
    const estimatedReglageStart = startingPoint;
    const estimatedReglageEnd = advanceProdDate(estimatedReglageStart, base.operationsTotal);
    const estimatedProductionStart = estimatedReglageEnd;
    const estimatedProductionEnd = advanceProdDate(estimatedProductionStart, base.prodLength);
    startingPoint = estimatedProductionEnd;
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
