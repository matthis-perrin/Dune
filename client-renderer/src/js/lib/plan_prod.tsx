import {getPoseSize} from '@shared/lib/cliches';
import {getWeekDay} from '@shared/lib/time';
import {padNumber} from '@shared/lib/utils';
import {ProdRange, PlanProductionState, PlanProduction, PlanProductionInfo} from '@shared/models';

export const PLAN_PROD_NUMBER_DIGIT_COUNT = 5;

export function getPlanProdTitle(id: number): string {
  return `PRODUCTION N°${padNumber(id, PLAN_PROD_NUMBER_DIGIT_COUNT)}`;
}

export function getShortPlanProdTitle(id: number): string {
  return padNumber(id, PLAN_PROD_NUMBER_DIGIT_COUNT);
}

export function metersToProductionTime(
  meters: number,
  speed: number,
  includeChangeBobineMere: boolean,
  maxSpeedRatio: number
): number {
  const ratio = includeChangeBobineMere ? maxSpeedRatio : 1;
  return (meters / (speed * ratio)) * 60 * 1000;
}

export function productionTimeToMeters(
  productionTime: number,
  speed: number,
  includeChangeBobineMere: boolean,
  maxSpeedRatio: number
): number {
  const ratio = includeChangeBobineMere ? maxSpeedRatio : 1;
  return (productionTime / 60 / 1000) * (speed * ratio);
}

export function computeProductionTime(
  firstBobine: {longueur?: number},
  speed: number,
  tourCount: number,
  maxSpeedRatio: number
): number {
  const actualSpeed = maxSpeedRatio * speed;
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

export function getProductionDay(prodRanges: Map<string, ProdRange>): number {
  const date = new Date();
  while (!prodRanges.has(getWeekDay(date))) {
    date.setDate(date.getDate() + 1);
  }
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date.getTime();
}

export function getProductionForBobine(ref: string, planState: PlanProductionState): number {
  return (
    planState.selectedBobines
      .filter(b => b.ref === ref)
      .reduce((piste, b) => piste + getPoseSize(b.pose), 0) * (planState.tourCount || 0)
  );
}

export function asPlanProduction(
  data: PlanProductionState & PlanProductionInfo,
  id: number,
  speed: number
): PlanProduction | undefined {
  if (
    data.selectableBobines.length > 0 ||
    !data.selectedPolypro ||
    !data.selectedPapier ||
    !data.selectedPerfo ||
    !data.selectedRefente
  ) {
    return undefined;
  }
  return {
    id,
    localUpdate: new Date().getTime(),
    index: data.index,
    operationAtStartOfDay: data.operationAtStartOfDay,
    productionAtStartOfDay: data.productionAtStartOfDay,
    data: {
      polypro: data.selectedPolypro,
      papier: data.selectedPapier,
      perfo: data.selectedPerfo,
      refente: data.selectedRefente,
      bobines: data.selectedBobines,
      bobinesMini: [],
      bobinesMax: [],
      encriers: data.couleursEncrier[0],

      tourCount: data.tourCount || 0,
      speed,
      comment: '',
    },
  };
}
