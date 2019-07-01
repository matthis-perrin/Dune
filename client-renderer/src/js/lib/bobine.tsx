import {sum, min} from 'lodash-es';

import {ButtonMode} from '@root/components/core/button';
import {numberWithSeparator} from '@root/lib/utils';

import {getLastYear, getLastMonth} from '@shared/lib/cadencier';
import {getPoseSize} from '@shared/lib/cliches';
import {Stock, BobineQuantities, BobineState, POSE_NEUTRE} from '@shared/models';

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
  return sum(stock.map(s => getStockValue(s, type)));
}

export function getStockReel(ref: string, stocks: Map<string, Stock[]>): number {
  return getStock(ref, stocks, StockType.REEL);
}

export function getStockCommande(ref: string, stocks: Map<string, Stock[]>): number {
  return getStock(ref, stocks, StockType.COMMANDE);
}

export function getStockReserve(ref: string, stocks: Map<string, Stock[]>): number {
  return getStock(ref, stocks, StockType.RESERVE);
}

export function getStockTerme(ref: string, stocks: Map<string, Stock[]>): number {
  return getStock(ref, stocks, StockType.TERME);
}

const MONTHS_IN_YEAR = 12;
export function getBobineMonthlySelling(cadencier?: Map<number, number>): number {
  return Math.ceil(getBobineSellingPastYear(cadencier) / MONTHS_IN_YEAR);
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

export function getBobineTotalSell(
  bobineRef: string,
  cadencier: Map<string, Map<number, number>>
): {total: number; monthRange: number} {
  const sell = cadencier.get(bobineRef) || [];
  const months = Array.from(sell.keys());
  const values = Array.from(sell.values());

  if (months.length === 0) {
    return {total: 0, monthRange: 0};
  }

  const firstMonth = new Date(min(months) || 0);
  const lastMonth = new Date();
  const firstMonthIndex = firstMonth.getFullYear() * 12 + firstMonth.getMonth();
  const lastMonthIndex = lastMonth.getFullYear() * 12 + lastMonth.getMonth();

  const monthRange = lastMonthIndex - firstMonthIndex + 1;
  const total = sum(values);

  return {total, monthRange};
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

const INFINITE_STOCK = 1e10;
export function getBobineState(
  ref: string,
  stocks: Map<string, Stock[]>,
  cadencier: Map<string, Map<number, number>>,
  bobineQuantities: BobineQuantities[],
  additionalStock: number = 0
): {
  state: BobineState;
  quantity: number;
  yearSell: number;
  stock: number;
  info: string;
  infoValue: number;
} {
  const currentStock = getStockTerme(ref, stocks) + additionalStock;
  const lastYearSelling = getBobineSellingPastYear(cadencier.get(ref));
  const averageSellingByMonth = Math.ceil(lastYearSelling / MONTHS_IN_YEAR);
  const {threshold, quantity} = getQuantityToProduce(lastYearSelling, bobineQuantities);
  if (currentStock < averageSellingByMonth) {
    return {
      state: BobineState.Rupture,
      quantity,
      yearSell: lastYearSelling,
      stock: currentStock,
      info: `${numberWithSeparator(currentStock - averageSellingByMonth)}`,
      infoValue: currentStock - averageSellingByMonth,
    };
  }
  if (currentStock > lastYearSelling) {
    return {
      state: BobineState.Surstock,
      quantity,
      yearSell: lastYearSelling,
      stock: currentStock,
      info: `+${numberWithSeparator(currentStock - lastYearSelling)}`,
      infoValue: currentStock - lastYearSelling,
    };
  }
  if (currentStock < threshold) {
    return {
      state: BobineState.Alerte,
      quantity,
      yearSell: lastYearSelling,
      stock: currentStock,
      info: `${numberWithSeparator(currentStock - threshold)}`,
      infoValue: currentStock - threshold,
    };
  }
  return {
    state: BobineState.Neutre,
    quantity,
    yearSell: lastYearSelling,
    stock: currentStock,
    info:
      averageSellingByMonth === 0
        ? '∞'
        : `${Math.floor(currentStock / averageSellingByMonth)} mois`,
    infoValue:
      averageSellingByMonth === 0
        ? INFINITE_STOCK
        : Math.floor(currentStock / averageSellingByMonth),
  };
}

export function getBobinePoseState(
  ref: string,
  poses: number[],
  selectedBobines: {ref: string; pose: number}[],
  tourCount: number | undefined,
  stocks: Map<string, Stock[]>,
  cadencier: Map<string, Map<number, number>>,
  bobineQuantities: BobineQuantities[]
): {pose: number; mode: ButtonMode; reason?: string}[] {
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
      const totalPose = usedPoses + getPoseSize(pose);
      const additionalStock = tourCount ? totalPose * tourCount : 0;
      const {quantity, state, yearSell, stock} = getBobineState(
        ref,
        stocks,
        cadencier,
        bobineQuantities,
        additionalStock
      );
      const poseStr = pose === POSE_NEUTRE ? 'neutre' : pose;
      if (firstRuptureOrAlertBobine === ref) {
        return {
          pose,
          mode: ButtonMode.Neutral,
          reason: `Le nombre de tours sera ajusté pour produire ${quantity} bobines`,
        };
      }
      if (state === BobineState.Surstock) {
        return {
          pose,
          mode: ButtonMode.Danger,
          reason: `Ajouter cette bobine en pose ${poseStr} amènera la bobine en surstock (Stock prévisionnel : ${stock}, Vente annuelle : ${yearSell})`,
        };
      }
      if (!tourCount) {
        return {pose, mode: ButtonMode.Neutral};
      }
      const reason = `Ajouter cette bobine en pose ${poseStr} amènera la quantité produite à ${tourCount *
        totalPose} (Objectif: ${quantity})`;
      if (tourCount * totalPose === quantity) {
        return {pose, mode: ButtonMode.Success, reason};
      }
      if (tourCount * totalPose < quantity) {
        return {pose, mode: ButtonMode.Warning, reason};
      }
      return {pose, mode: ButtonMode.Warning, reason};
    })
    .sort((p1, p2) => {
      if (p1.mode === p2.mode) {
        return p2.pose - p1.pose;
      }
      return p1.mode - p2.mode;
    });
}
