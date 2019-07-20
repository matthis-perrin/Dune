import {memoize} from 'lodash-es';

const MONTHS_IN_YEAR = 12;

export function padNumber(value: number, padding: number): string {
  let valueStr = String(value);
  while (valueStr.length < padding) {
    valueStr = `0${valueStr}`;
  }
  return valueStr;
}

export function formatMonthCount(monthCount: number): string {
  if (monthCount < MONTHS_IN_YEAR) {
    return `${monthCount} mois`;
  }
  const yearCount = Math.floor(monthCount / MONTHS_IN_YEAR);
  const monthCountWithoutYear = monthCount - yearCount * MONTHS_IN_YEAR;
  const yearStr = yearCount > 1 ? `${yearCount} ans` : '1 an';
  if (monthCountWithoutYear === 0) {
    return yearStr;
  }
  return `${yearStr} et ${monthCountWithoutYear} mois`;
}

export const numberWithSeparator = memoize((value: number): string => value.toLocaleString('fr'));

export function getWeekDay(date: Date): string {
  return date.toLocaleString('fr-FR', {weekday: 'long'});
}

const DayOfWeek = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
// Monday = 0
export function getDayOfWeek(date: Date): number {
  return DayOfWeek.indexOf(getWeekDay(date));
}

export function isWeekDay(date: Date): boolean {
  const dayOfWeek = date.toLocaleString('fr-FR', {weekday: 'long'});
  return dayOfWeek !== 'samedi' && dayOfWeek !== 'dimanche';
}

export function startOfDay(): Date {
  const date = new Date();
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date;
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}

export function dateIsBeforeOrSameDay(date1: Date, date2: Date): boolean {
  if (date1.getFullYear() > date2.getFullYear()) {
    return false;
  }
  if (date1.getFullYear() < date2.getFullYear()) {
    return true;
  }
  if (date1.getMonth() > date2.getMonth()) {
    return false;
  }
  if (date1.getMonth() < date2.getMonth()) {
    return true;
  }
  if (date1.getDate() > date2.getDate()) {
    return false;
  }
  return true;
}

export function dateIsAfterOrSameDay(date1: Date, date2: Date): boolean {
  if (date1.getFullYear() < date2.getFullYear()) {
    return false;
  }
  if (date1.getFullYear() > date2.getFullYear()) {
    return true;
  }
  if (date1.getMonth() < date2.getMonth()) {
    return false;
  }
  if (date1.getMonth() > date2.getMonth()) {
    return true;
  }
  if (date1.getDate() < date2.getDate()) {
    return false;
  }
  return true;
}

export function dateAtHour(date: Date, hour: number, minute?: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute || 0);
}

export function isRoundMinute(date: Date): boolean {
  return date.getSeconds() === 0 && date.getMilliseconds() === 0;
}

export function isRoundHour(date: Date): boolean {
  return date.getMinutes() === 0 && isRoundMinute(date);
}

export function isHalfHour(date: Date): boolean {
  return date.getMinutes() === HALF_HOUR && isRoundMinute(date);
}

const HALF_HOUR = 30;

export function closestHalfHourBefore(date: Date): Date {
  const hour = date.getHours();
  const minute = date.getMinutes();
  if (minute === 0) {
    return dateAtHour(date, hour - 1, HALF_HOUR);
  }
  if (minute <= HALF_HOUR) {
    return dateAtHour(date, hour, 0);
  }
  return dateAtHour(date, hour, HALF_HOUR);
}

export function closestHalfHourAfter(date: Date): Date {
  const hour = date.getHours();
  const minute = date.getMinutes();
  if (minute === 0) {
    return dateAtHour(date, hour, HALF_HOUR);
  }
  if (minute < HALF_HOUR) {
    return dateAtHour(date, hour, HALF_HOUR);
  }
  return dateAtHour(date, hour + 1, 0);
}
