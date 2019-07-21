import {MAX_SPEED_RATIO} from '@root/lib/constants';
import {padNumber} from '@root/lib/utils';

import {PlanProductionInfo, PlanProduction} from '@shared/models';

export const PLAN_PROD_NUMBER_DIGIT_COUNT = 5;

export function getPlanProdTitle(id: number): string {
  return `PRODUCTION N°${padNumber(id, PLAN_PROD_NUMBER_DIGIT_COUNT)}`;
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

export function computeProductionTime(
  firstBobine: {longueur?: number},
  speed: number,
  tourCount: number
): number {
  const actualSpeed = MAX_SPEED_RATIO * speed;
  const lengthToProduce = tourCount * (firstBobine.longueur || 0);
  return Math.round((lengthToProduce / actualSpeed) * 60);
}

export function getMetrageLineaire(planProd: {
  bobines: {longueur?: number}[];
  tourCount?: number;
}): number {
  const {bobines, tourCount} = planProd;
  const bobineLength = bobines.length > 0 ? bobines[0].longueur || 0 : 0;
  const tourCountValue = tourCount || 0;
  return bobineLength * tourCountValue;
}

export function getBobineMereConsumption(planProd: {
  bobines: {longueur?: number}[];
  papier?: {longueur?: number};
  tourCount?: number;
}): number {
  const tourCountValue = planProd.tourCount || 0;

  const longueur = planProd.papier ? planProd.papier.longueur || 0 : 0;
  const longueurBobineFille = planProd.bobines.length > 0 ? planProd.bobines[0].longueur || 0 : 0;
  const prod = longueur !== 0 ? (tourCountValue * longueurBobineFille) / longueur : 0;
  return prod;
}
