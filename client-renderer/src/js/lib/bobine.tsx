import {sum} from 'lodash-es';

import {ButtonMode} from '@root/components/core/button';

import {getLastYear, getLastMonth} from '@shared/lib/cadencier';
import {getPoseSize} from '@shared/lib/cliches';
import {Stock, BobineQuantities, BobineState} from '@shared/models';

export function getStock(ref: string, stocks: Map<string, Stock[]>): number {
  const stock = stocks.get(ref) || [];
  //   return sum(stock.map(s => s.reel - s.reserve - s.commande));
  return sum(stock.map(s => s.reel));
}

export function getBobineSellingPastYear(cadencier?: Map<number, number>): number {
  if (!cadencier) {
    return 0;
  }
  let total = 0;
  const lastYear = getLastYear();
  const lastMonth = getLastMonth();
  cadencier.forEach((count, date) => {
    if (date > lastYear && date <= lastMonth) {
      total += count;
    }
  });
  return total;
}

function getDistanceToQuantityRange(value: number, quantity: BobineQuantities): number {
  if (value < quantity.soldMin) {
    return quantity.soldMin - value;
  }
  if (value > quantity.soldMax) {
    return value - quantity.soldMax;
  }
  return 0;
}

export function getQuantityToProduce(
  lastYearSelling: number,
  bobinesQuantities: BobineQuantities[]
): {threshold: number; quantity: number} {
  if (bobinesQuantities.length === 0) {
    return {threshold: 0, quantity: 1};
  }
  let closest: BobineQuantities = bobinesQuantities[0];
  let closestDistance = getDistanceToQuantityRange(lastYearSelling, bobinesQuantities[0]);
  for (const bobineQuantity of bobinesQuantities) {
    const distance = getDistanceToQuantityRange(lastYearSelling, bobineQuantity);
    if (distance < closestDistance) {
      closestDistance = distance;
      closest = bobineQuantity;
    }
    if (distance === 0) {
      break;
    }
  }
  return {threshold: closest.threshold, quantity: closest.qtyToProduce};
}

export function getBobineState(
  ref: string,
  stocks: Map<string, Stock[]>,
  cadencier: Map<string, Map<number, number>>,
  bobineQuantities: BobineQuantities[],
  additionalStock: number = 0
): {state: BobineState; quantity: number} {
  const currentStock = getStock(ref, stocks) + additionalStock;
  const lastYearSelling = getBobineSellingPastYear(cadencier.get(ref));
  const averageSellingByMonth = lastYearSelling / 12;
  const {threshold, quantity} = getQuantityToProduce(lastYearSelling, bobineQuantities);
  if (currentStock < averageSellingByMonth) {
    return {state: BobineState.Rupture, quantity};
  }
  if (currentStock > lastYearSelling) {
    return {state: BobineState.Surstock, quantity};
  }
  if (currentStock < threshold) {
    return {state: BobineState.Alerte, quantity};
  }
  return {state: BobineState.Neutre, quantity};
}

export function getBobinePoseState(
  ref: string,
  poses: number[],
  selectedBobines: {ref: string; pose: number}[],
  tourCount: number | undefined,
  stocks: Map<string, Stock[]>,
  cadencier: Map<string, Map<number, number>>,
  bobineQuantities: BobineQuantities[]
): {pose: number; mode: ButtonMode}[] {
  const firstRuptureOrAlertBobine: string | undefined = selectedBobines
    .filter(
      b =>
        [BobineState.Rupture, BobineState.Alerte].indexOf(
          getBobineState(b.ref, stocks, cadencier, bobineQuantities).state
        ) !== -1
    )
    .map(b => b.ref)[0];
  const usedPoses = sum(selectedBobines.filter(b => b.ref === ref).map(b => getPoseSize(b.pose)));

  return poses
    .map(pose => {
      const additionalStock = tourCount ? usedPoses + getPoseSize(pose) : 0;
      if (firstRuptureOrAlertBobine === ref) {
        return {pose, mode: ButtonMode.Neutral};
      }
      const {quantity, state} = getBobineState(
        ref,
        stocks,
        cadencier,
        bobineQuantities,
        additionalStock
      );
      if (state === BobineState.Surstock) {
        return {pose, mode: ButtonMode.Danger};
      }
      if (!tourCount) {
        return {pose, mode: ButtonMode.Neutral};
      }
      if ((tourCount * usedPoses) % quantity === 0) {
        return {pose, mode: ButtonMode.Success};
      }
      if (tourCount * usedPoses < quantity) {
        return {pose, mode: ButtonMode.Warning};
      }
      return {pose, mode: ButtonMode.Danger};
    })
    .sort((p1, p2) => {
      if (p1.mode === p2.mode) {
        return p2.pose - p1.pose;
      }
      return p1.mode - p2.mode;
    });
}
