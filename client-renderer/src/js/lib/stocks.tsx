import {sum} from 'lodash-es';

import {getSchedulesFromStartOfDayUpTo} from '@root/lib/schedule_utils';

import {getPoseSize} from '@shared/lib/cliches';
import {Stock, BobineMere, BobineFilleWithPose, Schedule} from '@shared/models';

export enum StockType {
  REEL,
  COMMANDE,
  RESERVE,
  TERME,
}

function getStockValue(stock: Stock, type: StockType): number {
  if (type === StockType.REEL) {
    return stock.reel;
  } else if (type === StockType.COMMANDE) {
    return stock.commande;
  } else if (type === StockType.RESERVE) {
    return stock.reserve;
  } else if (type === StockType.TERME) {
    return stock.reel + stock.commande - stock.reserve;
  }
  return 0;
}

export function getStock(ref: string, stocks: Map<string, Stock[]>, type: StockType): number {
  const stock = stocks.get(ref) || [];
  return sum(stock.map((s) => getStockValue(s, type)));
}

export function getStockDiff(
  ref: string,
  planProd: {
    bobines: BobineFilleWithPose[];
    papier: BobineMere;
    polypro: BobineMere;
  },
  prodMeters: number
): number {
  const {bobines, papier, polypro} = planProd;
  const longueurFirstBobine = bobines.length > 0 ? bobines[0].longueur || 0 : 0;
  if (papier.ref === ref) {
    return -prodMeters / (papier.longueur || 1);
  }
  if (polypro.ref === ref) {
    return -prodMeters / (polypro.longueur || 1);
  }
  const pistes = bobines
    .filter((b) => b.ref === ref)
    .reduce((acc, curr) => acc + getPoseSize(curr.pose), 0);
  return pistes * Math.round(prodMeters / longueurFirstBobine);
}

export function getStockPrevisionel(
  ref: string,
  stocks: Map<string, Stock[]>,
  schedule: Schedule,
  type: StockType,
  atTime: number
): number {
  const startStock = getStock(ref, stocks, type);
  const futurSchedules = getSchedulesFromStartOfDayUpTo(schedule, atTime);
  const stockDiffs = futurSchedules.map((s) =>
    getStockDiff(ref, s.planProd.data, s.doneProdMeters + s.plannedProdMeters)
  );
  const totalDiff = stockDiffs.reduce((acc, curr) => acc + curr, 0);
  return startStock + totalDiff;
}

export function getStockReel(ref: string, stocks: Map<string, Stock[]>): number {
  return getStock(ref, stocks, StockType.REEL);
}

export function getStockReelPrevisionel(
  ref: string,
  stocks: Map<string, Stock[]>,
  schedule: Schedule,
  atTime: number
): number {
  return getStockPrevisionel(ref, stocks, schedule, StockType.REEL, atTime);
}

export function getStockCommande(ref: string, stocks: Map<string, Stock[]>): number {
  return getStock(ref, stocks, StockType.COMMANDE);
}

export function getStockCommandePrevisionel(
  ref: string,
  stocks: Map<string, Stock[]>,
  schedule: Schedule,
  atTime: number
): number {
  return getStockPrevisionel(ref, stocks, schedule, StockType.COMMANDE, atTime);
}

export function getStockReserve(ref: string, stocks: Map<string, Stock[]>): number {
  return getStock(ref, stocks, StockType.RESERVE);
}

export function getStockReservePrevisionel(
  ref: string,
  stocks: Map<string, Stock[]>,
  schedule: Schedule,
  atTime: number
): number {
  return getStockPrevisionel(ref, stocks, schedule, StockType.RESERVE, atTime);
}

export function getStockTerme(ref: string, stocks: Map<string, Stock[]>): number {
  return getStock(ref, stocks, StockType.TERME);
}

export function getStockTermePrevisionel(
  ref: string,
  stocks: Map<string, Stock[]>,
  schedule: Schedule,
  atTime: number
): number {
  return getStockPrevisionel(ref, stocks, schedule, StockType.TERME, atTime);
}
