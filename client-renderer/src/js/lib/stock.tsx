import {sum} from 'lodash-es';
import {Stock} from '@shared/models';

export function getStock(ref: string, stocks: Map<string, Stock[]>): number {
  const stock = stocks.get(ref) || [];
  //   return sum(stock.map(s => s.reel - s.reserve - s.commande));
  return sum(stock.map(s => s.reel));
}
