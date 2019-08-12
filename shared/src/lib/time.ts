import {ProdRange} from '@shared/models';

export const MONTHS_STRING = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

export function dateAtHour(date: Date, hour: number, minute?: number, second?: number): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hour,
    minute || 0,
    second || 0
  );
}

const memo = new Map<number, string>();
export function getWeekDay(date: Date): string {
  const res = memo.get(date.getTime());
  if (res !== undefined) {
    return res;
  }
  const weekDay = date.toLocaleString('fr-FR', {weekday: 'long'});
  memo.set(date.getTime(), weekDay);
  return weekDay;
}

export function getNextProdStart(time: number, prodRanges: Map<string, ProdRange>): number {
  const date = new Date(time);
  let prodRange = prodRanges.get(getWeekDay(date));
  if (prodRange) {
    const prodStart = dateAtHour(date, prodRange.startHour, prodRange.startMinute);
    if (prodStart.getTime() > time) {
      return prodStart.getTime();
    }
  }
  do {
    date.setDate(date.getDate() + 1);
    prodRange = prodRanges.get(getWeekDay(date));
  } while (prodRange === undefined);

  return dateAtHour(date, prodRange.startHour, prodRange.startMinute).getTime();
}
