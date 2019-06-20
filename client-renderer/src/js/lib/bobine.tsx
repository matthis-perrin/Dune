import {sum} from 'lodash-es';

import {getLastYear, getLastMonth} from '@shared/lib/cadencier';
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
  let sum = 0;
  const lastYear = getLastYear();
  const lastMonth = getLastMonth();
  cadencier.forEach((count, date) => {
    if (date > lastYear && date <= lastMonth) {
      sum += count;
    }
  });
  return sum;
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
  bobineQuantities: BobineQuantities[]
): {state: BobineState; quantity: number} {
  const currentStock = getStock(ref, stocks);
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
