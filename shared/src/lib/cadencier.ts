import {Vente} from '@shared/models';

export enum CadencierType {
  DEVIS = 0,
  BON_DE_COMMANDE = 1,
  PREPARATION_DE_LIVRAISON = 2,
  BON_DE_LIVRAISON = 3,
  BON_DE_RETOUR = 4,
  BON_D_AVOIR = 5,
  FACTURE = 6,
  FACTURE_COMPTABILISEE = 7,
}

export const CadencierTypeDescription = new Map<CadencierType, string>([
  [CadencierType.DEVIS, 'Devis'],
  [CadencierType.BON_DE_COMMANDE, 'Bon de commande'],
  [CadencierType.PREPARATION_DE_LIVRAISON, 'Préparation de livraison'],
  [CadencierType.BON_DE_LIVRAISON, 'Bon de livraison'],
  [CadencierType.BON_DE_RETOUR, 'Bon de retour'],
  [CadencierType.BON_D_AVOIR, 'Bon d’avoir'],
  [CadencierType.FACTURE, 'Facture'],
  [CadencierType.FACTURE_COMPTABILISEE, 'Facture comptabilisée'],
]);

const MIDDLE_OF_MONTH = 15;
const LAST_MONTH = 11;

export function roundToMonth(timestamp: number): number {
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth(), MIDDLE_OF_MONTH).getTime();
}

export function getLastYear(): number {
  const date = new Date();
  return new Date(date.getFullYear() - 1, date.getMonth() - 1, MIDDLE_OF_MONTH).getTime();
}

export function getLastMonth(): number {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth() - 1, MIDDLE_OF_MONTH).getTime();
}

export function aggregateByMonth(cadencier: Vente[]): Map<number, Vente[]> {
  const data = new Map<number, Vente[]>();
  cadencier.forEach(v => {
    const ts = roundToMonth(v.date);
    const current = data.get(ts);
    if (!current) {
      data.set(ts, [v]);
    } else {
      current.push(v);
    }
  });
  return data;
}

export function createMonthsRange(
  startTs: number,
  endTs: number,
  forceFullYear: boolean = false
): number[] {
  const res: number[] = [];
  const startDate = new Date(startTs);
  const endDate = new Date(endTs);
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  for (let year = startYear; year <= endYear; year++) {
    const startMonth = year === startYear && !forceFullYear ? startDate.getMonth() : 0;
    const endMonth = year === endYear && !forceFullYear ? endDate.getMonth() : LAST_MONTH;
    for (let month = startMonth; month <= endMonth; month++) {
      res.push(new Date(year, month, MIDDLE_OF_MONTH).getTime());
    }
  }
  return res;
}
