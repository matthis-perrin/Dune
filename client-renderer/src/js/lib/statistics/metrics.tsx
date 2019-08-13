import {sum} from 'lodash-es';

import {ADDITIONAL_TIME_TO_RESTART_PROD} from '@root/lib/constants';
import {numberWithSeparator, formatDuration} from '@root/lib/utils';
import {Palette, Colors} from '@root/theme';

import {PlanDayStats, StopType, Operation, StopStat, OperationConstraint} from '@shared/models';

export interface MetricFilter {
  name: string;
  label: string;
  color: string;
}

export const MORNING_TEAM_FILTER = {
  name: 'morning',
  label: 'Équipe matin',
  color: Palette.Concrete,
};
export const AFTERNOON_TEAM_FILTER = {
  name: 'afternoon',
  label: 'Équipe soir',
  color: Palette.Asbestos,
};
export const ALL_TEAM_FILTER = {
  name: 'all',
  label: 'Équipes cumulées',
  color: Colors.SecondaryDark,
};

export const MORNING_AFTERNOON_FILTERS = [
  MORNING_TEAM_FILTER,
  AFTERNOON_TEAM_FILTER,
  ALL_TEAM_FILTER,
];

export const UNPLANNED_STOP_FILTER = {
  name: 'unplanned',
  label: 'Arrêts Imprévus',
  color: Colors.Danger,
};

export const PLANNED_STOP_FILTER = {
  name: 'planned',
  label: 'Arrêts Prévus',
  color: Palette.PeterRiver,
};

export const NON_PROD_STOP_FILTER = {
  name: 'non-prod',
  label: 'Maintenance & Non prod',
  color: Palette.Asbestos,
};

export const PROD_STOP_FILTER = {
  name: 'prod',
  label: 'Production',
  color: Palette.Nephritis,
};

const STOP_FILTERS = [
  UNPLANNED_STOP_FILTER,
  PLANNED_STOP_FILTER,
  NON_PROD_STOP_FILTER,
  PROD_STOP_FILTER,
];

const UnplannedStopTypes = [
  StopType.EndOfDayEndProd,
  StopType.EndOfDayPauseProd,
  StopType.Unplanned,
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
      return stops.filter(s => UnplannedStopTypes.indexOf(s.type) !== -1).map(s => s.duration);
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

export type TeamTypes = 'morning' | 'afternoon' | 'all';
export type DelayTypes = 'change-prod' | 'reprise-prod' | 'unplanned' | 'change-bobine' | 'all';

export function getDelays(
  dayStats: PlanDayStats,
  operations: Operation[],
  team: TeamTypes,
  type: DelayTypes
): number[] {
  const planTotalOperationsDelay =
    dayStats.planTotalOperationDone - dayStats.planTotalOperationPlanned;

  let values: number[] = [];
  const stops = dayStats.morningStops.concat(dayStats.afternoonStops);

  let stopsToCheck: StopStat[] = [];
  if (team === 'morning' || team === 'all') {
    stopsToCheck = stopsToCheck.concat(dayStats.morningStops);
  }
  if (team === 'afternoon' || team === 'all') {
    stopsToCheck = stopsToCheck.concat(dayStats.afternoonStops);
  }

  const hasChangePlanProdStop = stops.filter(s => s.type === StopType.ChangePlanProd).length > 0;
  const operationTypes = [StopType.ChangePlanProd];
  const repriseTypes = [StopType.ReprisePlanProd];
  if (hasChangePlanProdStop) {
    operationTypes.push(StopType.ReglagesAdditionel);
  } else {
    repriseTypes.push(StopType.ReglagesAdditionel);
  }

  // Change Prod delays
  if (type === 'change-prod' || type === 'all') {
    values = values.concat(
      stopsToCheck
        .filter(s => operationTypes.indexOf(s.type) !== -1)
        .map(p => (planTotalOperationsDelay * p.duration) / dayStats.planTotalOperationDone)
    );
  }

  // Reprise Prod delays
  if (type === 'reprise-prod' || type === 'all') {
    const repriseStops = stopsToCheck.filter(s => repriseTypes.indexOf(s.type) !== -1);
    const repriseTotalTime = sum(repriseStops.map(s => s.duration));
    const repriseDelay = repriseTotalTime - ADDITIONAL_TIME_TO_RESTART_PROD;
    values = values.concat(repriseStops.map(p => (repriseDelay * p.duration) / repriseTotalTime));
  }

  // Unplanned delays
  if (type === 'unplanned' || type === 'all') {
    values = values.concat(
      stopsToCheck.filter(s => UnplannedStopTypes.indexOf(s.type) !== -1).map(s => s.duration)
    );
  }

  // Change Bobines Papier
  if (type === 'change-bobine' || type === 'all') {
    const planChangeBobinePapierTime = sum(
      operations
        .filter(o => o.constraint === OperationConstraint.ChangementBobinesMerePapier)
        .map(o => o.duration * 1000)
    );
    values = values.concat(
      stopsToCheck
        .filter(s => s.type === StopType.ChangeBobinePapier)
        .map(s => s.duration - s.ratio * planChangeBobinePapierTime)
    );

    // Change Bobines Polypro
    const planChangeBobinePolyproTime = sum(
      operations
        .filter(o => o.constraint === OperationConstraint.ChangementBobinesMerePolypro)
        .map(o => o.duration * 1000)
    );
    values = values.concat(
      stopsToCheck
        .filter(s => s.type === StopType.ChangeBobinePolypro)
        .map(s => s.duration - s.ratio * planChangeBobinePolyproTime)
    );

    // Change Bobines Papier and Polypro
    const planChangeBobinePapierAndPolyproTime =
      planChangeBobinePapierTime + planChangeBobinePolyproTime;
    values = values.concat(
      stopsToCheck
        .filter(s => s.type === StopType.ChangeBobinePapierAndPolypro)
        .map(s => s.duration - s.ratio * planChangeBobinePapierAndPolyproTime)
    );
  }

  return values;
}

export const DELAY_METRIC: StatsMetric = {
  name: 'delay',
  label: 'RETARD',
  yAxis: (metricFilter: string, dayStats: PlanDayStats, operations: Operation[]) =>
    getDelays(dayStats, operations, 'all', metricFilter as DelayTypes),
  renderY: formatDuration,
  filters: MORNING_AFTERNOON_FILTERS,
  initialFilter: ['all'],
  aggregation: 'sum',
  mode: 'separated',
};
