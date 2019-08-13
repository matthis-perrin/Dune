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

const PLANNED_UNPLANNED_FILTERS = [
  {
    name: 'planned',
    label: 'Arrêts Prévus',
    color: Palette.PeterRiver,
  },
  {
    name: 'unplanned',
    label: 'Arrêts Imprévus',
    color: Colors.Danger,
  },
  {
    name: 'all',
    label: 'Arrêts cumulés',
    color: Palette.Asbestos,
  },
];

export interface StatsMetric {
  name: string;
  label: string;
  yAxis(metricFilter: string, dayStats: PlanDayStats, operations: Operation[]): number;
  renderY(value: number): string;
  filters: MetricFilter[];
  initialFilter: string;
  aggregation: 'sum' | 'avg';
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
  aggregation: 'sum',
};

export const STOP_METRIC: StatsMetric = {
  name: 'stop',
  label: 'ARRÊTS',
  yAxis: (metricFilter: string, dayStats: PlanDayStats) => {
    const stops = dayStats.morningStops.concat(dayStats.afternoonStops);
    let value = 0;
    if (metricFilter === 'planned' || metricFilter === 'all') {
      value += sum(
        stops
          .filter(
            s =>
              [
                StopType.ChangePlanProd,
                StopType.ReprisePlanProd,
                StopType.ReglagesAdditionel,
                StopType.ChangeBobinePapier,
                StopType.ChangeBobinePolypro,
                StopType.ChangeBobinePapierAndPolypro,
                StopType.EndOfDayEndProd,
                StopType.EndOfDayPauseProd,
                StopType.Maintenance,
              ].indexOf(s.type) !== -1
          )
          .map(s => s.duration)
      );
    }
    if (metricFilter === 'unplanned' || metricFilter === 'all') {
      value += sum(
        stops.filter(s => [StopType.Unplanned].indexOf(s.type) !== -1).map(s => s.duration)
      );
    }
    return value;
  },
  renderY: formatDuration,
  filters: PLANNED_UNPLANNED_FILTERS,
  initialFilter: 'all',
  aggregation: 'sum',
};

export const DELAY_METRIC: StatsMetric = {
  name: 'delay',
  label: 'RETARD',
  yAxis: (metricFilter: string, dayStats: PlanDayStats, operations: Operation[]) => {
    const planTotalOerationsDelay =
      dayStats.planTotalOperationDone - dayStats.planTotalOperationPlanned;

    let value = 0;
    if (metricFilter === 'morning' || metricFilter === 'all') {
      const stops = dayStats.morningStops;
      const hasChangePlanProdStop =
        stops.filter(s => s.type === StopType.ChangePlanProd).length > 0;
      const morningOperationStops = hasChangePlanProdStop
        ? stops.filter(
            s => [StopType.ChangePlanProd, StopType.ReglagesAdditionel].indexOf(s.type) !== -1
          )
        : [];
      value += sum(
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
      value += sum(
        afternoonOperationStops.map(
          p => planTotalOerationsDelay * ((p.ratio * p.duration) / dayStats.planTotalOperationDone)
        )
      );
    }
    return value;
  },
  renderY: formatDuration,
  filters: MORNING_AFTERNOON_FILTERS,
  initialFilter: 'all',
  aggregation: 'sum',
};
