import {zip} from 'lodash-es';
import {number} from 'prop-types';

import {padNumber} from '@root/lib/utils';

import {getPoseSize} from '@shared/lib/cliches';
import {EncrierColor} from '@shared/lib/encrier';
import {getRefenteLaizes} from '@shared/lib/refentes';
import {Perfo, OperationConstraint, Refente, BobineMere, BobineFilleWithPose} from '@shared/models';

const PLAN_PROD_NUMBER_DIGIT_COUNT = 5;

export function getPlanProdTitle(id: number): string {
  return `PRODUCTION N°${padNumber(id, PLAN_PROD_NUMBER_DIGIT_COUNT)}`;
}

export interface PlanProdStateLight {
  perfo: Perfo;
  refente: Refente;
  papier: BobineMere;
  polypro: BobineMere;
  encrierColors: EncrierColor[];
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
  encrierColors: EncrierColor[]
): {index: number; color: string}[] {
  const indexes: {index: number; color: string}[] = [];
  encrierColors.forEach((encrier, index) => {
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
  encrierColors: EncrierColor[]
): Map<string, ClichePosition[]> {
  const clichePosePositions = new Map<string, ClichePosition[]>();
  let distance = 0;
  bobines.forEach(b => {
    const {refCliche1, refCliche2, pose} = b;
    const poseSize = getPoseSize(pose);
    const processCliche = (clicheRef?: string): void => {
      if (clicheRef) {
        const indexes = getClicheEncrierIndexes(clicheRef, encrierColors);
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

export function countClicheDiff(before: PlanProdStateLight, after: PlanProdStateLight): number {
  const beforeClichePosePositions = makeClichePosePositions(before.bobines, before.encrierColors);
  const afterClichePosePositions = makeClichePosePositions(after.bobines, after.encrierColors);

  let retraitClicheCount = 0;
  beforeClichePosePositions.forEach((positions, clichePose) => {
    positions.forEach(position => {
      const afterPositions = afterClichePosePositions.get(clichePose);
      if (!afterPositions) {
        retraitClicheCount++;
        return;
      }
      afterPositions.forEach(afterPosition => {
        if (
          position.color !== afterPosition.color ||
          position.distance !== afterPosition.distance ||
          position.encrierIndex !== afterPosition.distance
        ) {
          retraitClicheCount++;
        }
      });
    });
  });

  return retraitClicheCount;
}

export function countChangementsCouleurs(
  before: PlanProdStateLight,
  after: PlanProdStateLight
): {vidage: number; remplissage: number} {
  const beforeCouleurs = before.encrierColors.map(({color}) => color);
  const afterCouleurs = after.encrierColors.map(({color}) => color);
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

function getPositionsByDistance(positions: ClichePosition[]): Map<number, ClichePosition[]> {
  const positionsByDistance = new Map<number, ClichePosition[]>();
  positions.forEach(afterPosition => {
    const positionsForDistance = positionsByDistance.get(afterPosition.distance);
    if (positionsForDistance === undefined) {
      positionsByDistance.set(afterPosition.distance, [afterPosition]);
    } else {
      positionsForDistance.push(afterPosition);
    }
  });
  return positionsByDistance;
}

export function countNewMultiCouleursCliches(
  before: PlanProdStateLight,
  after: PlanProdStateLight
): number {
  const beforeClichePosePositions = makeClichePosePositions(before.bobines, before.encrierColors);
  const afterClichePosePositions = makeClichePosePositions(after.bobines, after.encrierColors);

  let newMultiCouleursClichesCount = 0;
  afterClichePosePositions.forEach((positions, clichePose) => {
    const afterPositionByDistance = getPositionsByDistance(positions);
    const beforePositionByDistance = getPositionsByDistance(
      beforeClichePosePositions.get(clichePose) || []
    );
    afterPositionByDistance.forEach((poses, distance) => {
      const alreadyHereCount = Math.min(
        0,
        (beforePositionByDistance.get(distance) || []).length - 1
      );
      const extraMultiCouleursCount = poses.length - alreadyHereCount - 1;
      newMultiCouleursClichesCount += extraMultiCouleursCount;
    });
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
