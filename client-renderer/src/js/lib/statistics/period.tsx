import React from 'react';

import {WeekText} from '@root/components/apps/statistics/time_format';

import {
  nextWeek,
  previousWeek,
  getWeekDays,
  previousMonth,
  nextMonth,
  getMonthDays,
  previousYear,
  nextYear,
  getYearDaysByMonth,
} from '@shared/lib/time';
import {padNumber, capitalize} from '@shared/lib/utils';
import {StatsData, ProdRange} from '@shared/models';

export interface StatsPeriod {
  name: string;
  label: string;
  renderPeriod(time: number, prodHours: Map<string, ProdRange>): string | JSX.Element;
  previous(time: number): number;
  next(time: number): number;
  canNavigate: boolean;
  xAxis(statsData: StatsData, prodHours: Map<string, ProdRange>, date: number): number[][];
  renderX(days: number[]): string;
}

export const WEEK_STATS_PERIOD: StatsPeriod = {
  name: 'week',
  label: 'SEMAINE',
  renderPeriod: (time: number, prodHours: Map<string, ProdRange>) => (
    <WeekText ts={time} prodHours={prodHours} />
  ),
  previous: previousWeek,
  next: nextWeek,
  canNavigate: true,
  xAxis: (statsData: StatsData, prodHours: Map<string, ProdRange>, date: number): number[][] =>
    getWeekDays(prodHours, date).map(d => [d]),
  renderX: (days: number[]): string => new Date(days[0]).toLocaleString('fr', {weekday: 'long'}),
};

export const MONTH_STATS_PERIOD: StatsPeriod = {
  name: 'month',
  label: 'MOIS',
  renderPeriod: (time: number, prodHours: Map<string, ProdRange>) => {
    const date = new Date(time);
    const month = capitalize(date.toLocaleString('fr', {month: 'long'}));
    const year = date.getFullYear();
    return `${month} - ${year}`;
  },
  previous: previousMonth,
  next: nextMonth,
  canNavigate: true,
  xAxis: (statsData: StatsData, prodHours: Map<string, ProdRange>, date: number): number[][] =>
    getMonthDays(prodHours, date).map(d => [d]),
  renderX: (days: number[]): string => {
    const day = padNumber(new Date(days[0]).getDate(), 2);
    const month = padNumber(new Date(days[0]).getDate() + 1, 2);
    return `${day}/${month}`;
  },
};

export const YEAR_STATS_PERIOD: StatsPeriod = {
  name: 'year',
  label: 'ANNÉE',
  renderPeriod: (time: number, prodHours: Map<string, ProdRange>) =>
    new Date(time).toLocaleDateString('fr', {year: 'numeric'}),
  previous: previousYear,
  next: nextYear,
  canNavigate: true,
  xAxis: (statsData: StatsData, prodHours: Map<string, ProdRange>, date: number): number[][] =>
    getYearDaysByMonth(date),
  renderX: (days: number[]): string =>
    capitalize(new Date(days[0]).toLocaleString('fr', {month: 'long'})),
};
