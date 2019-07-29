import {memoize} from 'lodash-es';
import {getWeekDay, dateAtHour} from '@shared/lib/time';

const MONTHS_IN_YEAR = 12;
const MS_IN_HOUR = 1000 * 60 * 60;
const MS_IN_MINUTE = 1000 * 60;
const MS_IN_SECONDS = 1000;

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
export const roundedToDigit = (value: number, digit: number): string => {
  const divider = Math.pow(10, digit);
  return numberWithSeparator(Math.round(value * divider) / divider);
};

export function formatProdTime(date: Date): string {
  const weekDayLength = 3;
  const weekDay = capitalize(getWeekDay(date).slice(0, weekDayLength));
  const day = date.toLocaleString('fr', {day: '2-digit'});
  const time = date.toLocaleTimeString('fr');
  return `${weekDay} ${day} ${time}`;
}

export function formatDuration(duration: number): string {
  const hours = Math.floor(duration / MS_IN_HOUR);
  duration -= hours * MS_IN_HOUR;
  const minutes = Math.floor(duration / MS_IN_MINUTE);
  duration -= minutes * MS_IN_MINUTE;
  const seconds = Math.floor(duration / MS_IN_SECONDS);

  const minutesStr = padNumber(minutes, 2);
  const secondsStr = padNumber(seconds, 2);

  if (hours === 0) {
    return `${minutesStr}:${secondsStr}`;
  }

  const hoursStr = padNumber(hours, 2);
  return `${hoursStr}:${minutesStr}:${secondsStr}`;
}

export function capitalize(value: string): string {
  if (value.length === 0) {
    return '';
  }
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
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

export function startOfDay(date?: Date): Date {
  const d = date || new Date();
  d.setHours(0);
  d.setMinutes(0);
  d.setSeconds(0);
  d.setMilliseconds(0);
  return d;
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
