import {sum} from 'lodash-es';

import {numberWithSeparator, formatDuration} from '@root/lib/utils';
import {Palette, Colors} from '@root/theme';

import {PlanDayStats, StopType, Operation} from '@shared/models';

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

const STOP_FILTERS = [
  {
    name: 'unplanned',
    label: 'Arrêts Imprévus',
    color: Colors.Danger,
  },
  {
    name: 'planned',
    label: 'Arrêts Prévus',
    color: Palette.PeterRiver,
  },
  {
    name: 'non-prod',
    label: 'Maintenance & Non prod',
    color: Palette.Asbestos,
  },
  {
    name: 'prod',
    label: 'Production',
    color: Palette.Nephritis,
  },
];

export interface StatsMetric {
  name: string;
  label: string;
  yAxis(metricFilter: string, dayStats: PlanDayStats, operations: Operation[]): number[];
  renderY(value: number): string;
  filters: MetricFilter[];
  initialFilter: string[];
  aggregation: 'sum' | 'avg';
  mode: 'separated' | 'stacked';
}

export const METRAGE_METRIC: StatsMetric = {
  name: 'metrage',
  label: 'MÉTRAGE',
  yAxis: (metricFilter: string, dayStats: PlanDayStats) => {
    let values: number[] = [];
    if (metricFilter === 'morning' || metricFilter === 'all') {
      values = values.concat(dayStats.morningProds.map(p => p.metrage));
    }
    if (metricFilter === 'afternoon' || metricFilter === 'all') {
      values = values.concat(dayStats.afternoonProds.map(p => p.metrage));
    }
    return values;
  },
  renderY: (value: number): string => `${numberWithSeparator(value)} m`,
  filters: MORNING_AFTERNOON_FILTERS,
  initialFilter: ['all'],
  aggregation: 'sum',
  mode: 'separated',
};

export const STOP_METRIC: StatsMetric = {
  name: 'stop',
  label: 'ARRÊTS',
  yAxis: (metricFilter: string, dayStats: PlanDayStats) => {
    if (metricFilter === 'prod') {
      const prods = dayStats.morningProds.concat(dayStats.afternoonProds);
      return prods.map(p => p.duration);
    }
    const stops = dayStats.morningStops.concat(dayStats.afternoonStops);
    if (metricFilter === 'planned') {
      return stops
        .filter(
          s =>
            [
              StopType.ChangePlanProd,
              StopType.ReprisePlanProd,
              StopType.ReglagesAdditionel,
              StopType.ChangeBobinePapier,
              StopType.ChangeBobinePolypro,
              StopType.ChangeBobinePapierAndPolypro,
            ].indexOf(s.type) !== -1
        )
        .map(s => s.duration);
    }
    if (metricFilter === 'unplanned') {
      return stops
        .filter(
          s =>
            [StopType.EndOfDayEndProd, StopType.EndOfDayPauseProd, StopType.Unplanned].indexOf(
              s.type
            ) !== -1
        )
        .map(s => s.duration);
    }
    if (metricFilter === 'non-prod') {
      return stops
        .filter(s => [StopType.Maintenance, StopType.NotProdHours].indexOf(s.type) !== -1)
        .map(s => s.duration);
    }
    return [];
  },
  renderY: formatDuration,
  filters: STOP_FILTERS,
  initialFilter: ['unplanned', 'planned', 'non-prod', 'prod'],
  aggregation: 'sum',
  mode: 'stacked',
};

export const DELAY_METRIC: StatsMetric = {
  name: 'delay',
  label: 'RETARD',
  yAxis: (metricFilter: string, dayStats: PlanDayStats, operations: Operation[]) => {
    const planTotalOerationsDelay =
      dayStats.planTotalOperationDone - dayStats.planTotalOperationPlanned;

    let values: number[] = [];
    if (metricFilter === 'morning' || metricFilter === 'all') {
      const stops = dayStats.morningStops;
      const hasChangePlanProdStop =
        stops.filter(s => s.type === StopType.ChangePlanProd).length > 0;
      const morningOperationStops = hasChangePlanProdStop
        ? stops.filter(
            s => [StopType.ChangePlanProd, StopType.ReglagesAdditionel].indexOf(s.type) !== -1
          )
        : [];
      values = values.concat(
        morningOperationStops.map(
          p => planTotalOerationsDelay * ((p.ratio * p.duration) / dayStats.planTotalOperationDone)
        )
      );
    }
    if (metricFilter === 'afternoon' || metricFilter === 'all') {
      const stops = dayStats.afternoonStops;
      const hasChangePlanProdStop =
        stops.filter(s => s.type === StopType.ChangePlanProd).length > 0;
      const afternoonOperationStops = hasChangePlanProdStop
        ? stops.filter(
            s => [StopType.ChangePlanProd, StopType.ReglagesAdditionel].indexOf(s.type) !== -1
          )
        : [];
      values = values.concat(
        afternoonOperationStops.map(
          p => planTotalOerationsDelay * ((p.ratio * p.duration) / dayStats.planTotalOperationDone)
        )
      );
    }
    return values;
  },
  renderY: formatDuration,
  filters: MORNING_AFTERNOON_FILTERS,
  initialFilter: ['all'],
  aggregation: 'sum',
  mode: 'separated',
};
