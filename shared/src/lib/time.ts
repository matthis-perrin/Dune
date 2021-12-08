import {startOfDay} from '@shared/lib/utils';
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

const DayOfWeek = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

const HOUR_IN_DAY = 24;
const DAY_IN_WEEK = 7;
const MS_IN_DAY = HOUR_IN_DAY * 60 * 60 * 1000;

// Monday = 0
export function getDayOfWeek(date: Date): number {
  return DayOfWeek.indexOf(getWeekDay(date));
}

export function isWeekDay(date: Date): boolean {
  const dayOfWeek = date.toLocaleString('fr-FR', {weekday: 'long'});
  return dayOfWeek !== 'samedi' && dayOfWeek !== 'dimanche';
}

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

export function getWeekDays(prodHours: Map<string, ProdRange>, ts: number): number[] {
  const weekDay = getDayOfWeek(new Date(ts));
  const beginningOfWeek = ts - weekDay * MS_IN_DAY;

  const days = [];

  let firstProdDay = beginningOfWeek;
  while (!prodHours.has(getWeekDay(new Date(firstProdDay)))) {
    firstProdDay += MS_IN_DAY;
  }

  let lastProdDay = firstProdDay;
  do {
    days.push(lastProdDay);
    lastProdDay += MS_IN_DAY;
  } while (prodHours.has(getWeekDay(new Date(lastProdDay))));

  return days.map(d => startOfDay(new Date(d)).getTime());
}

export function getMonthDays(prodHours: Map<string, ProdRange>, ts: number): number[] {
  const date = new Date(ts);
  const month = date.getMonth();
  const year = date.getFullYear();
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);

  const dates: number[] = [];
  let currentDate = startOfMonth;
  while (currentDate.getTime() <= endOfMonth.getTime()) {
    if (prodHours.has(getWeekDay(currentDate))) {
      dates.push(currentDate.getTime());
    }
    currentDate = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}

export function getYearDaysByMonth(ts: number): number[][] {
  const date = new Date(ts);
  const start = new Date(date.getFullYear(), 0);
  const year = start.getFullYear();

  let current = start;
  const days: number[][] = [[current.getTime()]];
  while (true) {
    const newCurrent = new Date(current);
    newCurrent.setDate(newCurrent.getDate() + 1);
    if (newCurrent.getFullYear() !== year) {
      break;
    }
    if (newCurrent.getMonth() !== current.getMonth()) {
      days.push([]);
    }
    days[days.length - 1].push(newCurrent.getTime());
    current = newCurrent;
  }

  return days;
}

export function nextWeek(time: number): number {
  return time + DAY_IN_WEEK * MS_IN_DAY;
}

export function previousWeek(time: number): number {
  return time - DAY_IN_WEEK * MS_IN_DAY;
}

export function nextMonth(time: number): number {
  const d = new Date(time);
  d.setMonth(d.getMonth() + 1);
  return d.getTime();
}

export function previousMonth(time: number): number {
  const d = new Date(time);
  d.setMonth(d.getMonth() - 1);
  return d.getTime();
}

export function nextYear(time: number): number {
  const d = new Date(time);
  d.setFullYear(d.getFullYear() + 1);
  return d.getTime();
}

export function previousYear(time: number): number {
  const d = new Date(time);
  d.setFullYear(d.getFullYear() - 1);
  return d.getTime();
}
