import * as React from 'react';

import {getDayOfWeek} from '@root/lib/utils';

import {getWeekDay} from '@shared/lib/time';
import {capitalize, padNumber, startOfDay} from '@shared/lib/utils';
import {ProdRange} from '@shared/models';

export const FullDayText: React.FC<{ts: number}> = ({ts}) => {
  const date = new Date(ts);
  const dayOfWeek = capitalize(getWeekDay(date));
  const day = date.getDate();
  const month = date.toLocaleString('fr-FR', {month: 'long'});
  const year = date.getFullYear();
  return <span>{`${dayOfWeek} ${day} ${month} ${year}`}</span>;
};

const HOUR_IN_DAY = 24;
const MS_IN_DAY = HOUR_IN_DAY * 60 * 60 * 1000;

export const WeekText: React.FC<{prodHours: Map<string, ProdRange>; ts: number}> = ({
  ts,
  prodHours,
}) => {
  const weekDays = getWeekDays(prodHours, ts);
  const firstProdDay = weekDays[0];
  const lastProdDay = weekDays[weekDays.length - 1];
  const formatDate = (date: Date): string =>
    `${padNumber(date.getDate(), 2)} ${capitalize(date.toLocaleString('fr', {month: 'long'}))}`;
  return (
    <span>{`${formatDate(new Date(firstProdDay))} au ${formatDate(new Date(lastProdDay))}`}</span>
  );
};

export function getWeekDays(prodHours: Map<string, ProdRange>, date: number): number[] {
  const weekDay = getDayOfWeek(new Date(date));
  const beginningOfWeek = date - weekDay * MS_IN_DAY;

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
