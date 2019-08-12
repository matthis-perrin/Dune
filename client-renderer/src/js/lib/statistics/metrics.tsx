import {sum} from 'lodash-es';

import {numberWithSeparator} from '@root/lib/utils';
import {Palette, Colors} from '@root/theme';

import {PlanDayStats} from '@shared/models';

export interface MetricFilter {
  name: string;
  label: string;
  color: string;
}

const MORNING_AFTERNOON_FILTERS = [
  {
    name: 'morning',
    label: 'Équipe matin',
    color: Palette.Concrete,
  },
  {
    name: 'afternoon',
    label: 'Équipe soir',
    color: Palette.Asbestos,
  },
  {
    name: 'all',
    label: 'Équipes cumulées',
    color: Colors.SecondaryDark,
  },
];

export interface StatsMetric {
  name: string;
  label: string;
  yAxis(metricFilter: string, dayStats: PlanDayStats): number;
  renderY(value: number): string;
  filters: MetricFilter[];
  initialFilter: string;
}

export const METRAGE_METRIC: StatsMetric = {
  name: 'metrage',
  label: 'MÉTRAGE',
  yAxis: (metricFilter: string, dayStats: PlanDayStats) => {
    let value = 0;
    if (metricFilter === 'morning' || metricFilter === 'all') {
      value += sum(dayStats.morningProds.map(p => p.metrage));
    }
    if (metricFilter === 'afternoon' || metricFilter === 'all') {
      value += sum(dayStats.afternoonProds.map(p => p.metrage));
    }
    return value;
  },
  renderY: (value: number): string => `${numberWithSeparator(value)} m`,
  filters: MORNING_AFTERNOON_FILTERS,
  initialFilter: 'all',
};
