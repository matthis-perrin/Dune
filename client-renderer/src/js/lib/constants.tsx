export const CAPACITE_MACHINE = 980;

export const MAX_SPEED_RATIO = 0.82;

export interface ProdRange {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

export const PROD_HOURS_BY_DAY = new Map<string, ProdRange>([
  ['lundi', {startHour: 6, startMinute: 0, endHour: 22, endMinute: 0}],
  ['mardi', {startHour: 6, startMinute: 0, endHour: 22, endMinute: 0}],
  ['mercredi', {startHour: 6, startMinute: 0, endHour: 22, endMinute: 0}],
  ['jeudi', {startHour: 6, startMinute: 0, endHour: 22, endMinute: 0}],
  ['vendredi', {startHour: 6, startMinute: 0, endHour: 19, endMinute: 0}],
]);

const ADDITIONAL_MINUTES_TO_RESTART_PROD = 20;
export const ADDITIONAL_TIME_TO_RESTART_PROD = ADDITIONAL_MINUTES_TO_RESTART_PROD * 60 * 1000;
