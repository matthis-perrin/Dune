import {zip, max} from 'lodash-es';

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
  OperationSplits,
  OperationSplit,
} from '@shared/models';

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
  const repartissableOperations = operations.filter(o => o.group === OperationGroup.Repartissable
  );

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
