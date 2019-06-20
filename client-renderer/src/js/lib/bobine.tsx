import {sum} from 'lodash-es';

import {getLastYear, getLastMonth} from '@shared/lib/cadencier';
import {Stock} from '@shared/models';

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
