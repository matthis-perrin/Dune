import * as React from 'react';

import {getWeekDay, getWeekDays} from '@shared/lib/time';
import {capitalize, padNumber} from '@shared/lib/utils';
import {ProdRange} from '@shared/models';

export const FullDayText: React.FC<{ts: number}> = ({ts}) => {
  const date = new Date(ts);
  const dayOfWeek = capitalize(getWeekDay(date));
  const day = date.getDate();
  const month = date.toLocaleString('fr-FR', {month: 'long'});
  const year = date.getFullYear();
  return <span>{`${dayOfWeek} ${day} ${month} ${year}`}</span>;
};

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
