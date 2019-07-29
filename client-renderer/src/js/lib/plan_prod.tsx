import {MAX_SPEED_RATIO} from '@root/lib/constants';
import {padNumber} from '@root/lib/utils';

import {getWeekDay} from '@shared/lib/time';
import {ProdRange} from '@shared/models';

export const PLAN_PROD_NUMBER_DIGIT_COUNT = 5;

export function getPlanProdTitle(id: number): string {
  return `PRODUCTION N°${padNumber(id, PLAN_PROD_NUMBER_DIGIT_COUNT)}`;
}

export function metersToProductionTime(meters: number, speed: number): number {
  return (meters / (speed * MAX_SPEED_RATIO)) * 60 * 1000;
}

export function productionTimeToMeters(productionTime: number, speed: number): number {
  return (productionTime / 60 / 1000) * (speed * MAX_SPEED_RATIO);
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
