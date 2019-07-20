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
