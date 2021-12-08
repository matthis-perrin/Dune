import {sum} from 'lodash-es';

import {numberWithSeparator, formatDuration} from '@root/lib/utils';
import {Palette, Colors} from '@root/theme';

import {
  PlanDayStats,
  StopType,
  Operation,
  StopStat,
  OperationConstraint,
  ProdStat,
  Constants,
} from '@shared/models';

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
  label: 'Périodes sans opérateurs',
  color: Palette.Asbestos,
};

export const MAINTENANCE_STOP_FILTER = {
  name: 'maintenance',
  label: 'Maintenances',
  color: Palette.Asbestos,
};

export const MAINTENANCE_AND_NON_PROD_STOP_FILTER = {
  name: 'maintenance-and-non-prod',
  label: 'Maintenance & Périodes sans opérateurs',
  color: Palette.Asbestos,
};

export const PROD_STOP_FILTER = {
  name: 'prod',
  label: 'Temps Production',
  color: Palette.Nephritis,
};

const STOP_FILTERS = [
  UNPLANNED_STOP_FILTER,
  PLANNED_STOP_FILTER,
  MAINTENANCE_AND_NON_PROD_STOP_FILTER,
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
  yAxis(
    metricFilter: string,
    dayStats: PlanDayStats,
    operations: Operation[],
    constants: Constants
  ): number[];
  renderY(value: number): string;
  filters: MetricFilter[];
  initialFilter: string[];
  aggregation: 'sum' | 'avg';
  mode: 'separated' | 'stacked';
}

export type TeamTypes = 'morning' | 'afternoon' | 'all';
export type DelayTypes = 'change-prod' | 'reprise-prod' | 'unplanned' | 'change-bobine' | 'all';

export function getMetrages(dayStats: PlanDayStats, teamFilter: TeamTypes): number[] {
  let values: number[] = [];
  if (teamFilter === 'morning' || teamFilter === 'all') {
    values = values.concat(dayStats.morningProds.map(p => p.metrage));
  }
  if (teamFilter === 'afternoon' || teamFilter === 'all') {
    values = values.concat(dayStats.afternoonProds.map(p => p.metrage));
  }
  return values;
}

export function getStops(
  dayStats: PlanDayStats,
  teamFilter: TeamTypes,
  stopFilter: string
): number[] {
  let stopsToCheck: StopStat[] = [];
  let prodsToCheck: ProdStat[] = [];
  if (teamFilter === 'morning' || teamFilter === 'all') {
    stopsToCheck = stopsToCheck.concat(dayStats.morningStops);
    prodsToCheck = prodsToCheck.concat(dayStats.morningProds);
  }
  if (teamFilter === 'afternoon' || teamFilter === 'all') {
    stopsToCheck = stopsToCheck.concat(dayStats.afternoonStops);
    prodsToCheck = prodsToCheck.concat(dayStats.afternoonProds);
  }
  if (stopFilter === PROD_STOP_FILTER.name) {
    return prodsToCheck.map(p => p.duration);
  }
  if (stopFilter === PLANNED_STOP_FILTER.name) {
    return stopsToCheck
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
  if (stopFilter === UNPLANNED_STOP_FILTER.name) {
    return stopsToCheck.filter(s => UnplannedStopTypes.indexOf(s.type) !== -1).map(s => s.duration);
  }
  if (stopFilter === MAINTENANCE_AND_NON_PROD_STOP_FILTER.name) {
    return stopsToCheck
      .filter(s => [StopType.Maintenance, StopType.NotProdHours].indexOf(s.type) !== -1)
      .map(s => s.duration);
  }
  if (stopFilter === MAINTENANCE_STOP_FILTER.name) {
    return stopsToCheck
      .filter(s => [StopType.Maintenance].indexOf(s.type) !== -1)
      .map(s => s.duration);
  }
  if (stopFilter === NON_PROD_STOP_FILTER.name) {
    return stopsToCheck
      .filter(s => [StopType.NotProdHours].indexOf(s.type) !== -1)
      .map(s => s.duration);
  }
  return [];
}

export function getDelays(
  dayStats: PlanDayStats,
  operations: Operation[],
  constants: Constants,
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
    if (dayStats.planTotalOperationDone > 0) {
      values = values.concat(
        stopsToCheck
          .filter(s => operationTypes.indexOf(s.type) !== -1)
          .map(p => (planTotalOperationsDelay * p.duration) / dayStats.planTotalOperationDone)
      );
    }
  }

  // Reprise Prod delays
  if (type === 'reprise-prod' || type === 'all') {
    const repriseStops = stopsToCheck.filter(s => repriseTypes.indexOf(s.type) !== -1);
    const repriseTotalTime = sum(repriseStops.map(s => s.duration));
    if (repriseTotalTime > 0) {
      const repriseDelay = repriseTotalTime - constants.reglageRepriseProdMs;
      values = values.concat(repriseStops.map(p => (repriseDelay * p.duration) / repriseTotalTime));
    }
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

export const METRAGE_METRIC: StatsMetric = {
  name: 'metrage',
  label: 'MÉTRAGE',
  yAxis: (metricFilter: string, dayStats: PlanDayStats) => {
    return getMetrages(dayStats, metricFilter as TeamTypes);
  },
  renderY: (value: number): string => `${numberWithSeparator(Math.round(value))} m`,
  filters: MORNING_AFTERNOON_FILTERS,
  initialFilter: ['all'],
  aggregation: 'sum',
  mode: 'separated',
};

export const STOP_METRIC: StatsMetric = {
  name: 'stop',
  label: 'ARRÊTS',
  yAxis: (metricFilter: string, dayStats: PlanDayStats) => {
    return getStops(dayStats, 'all', metricFilter);
  },
  renderY: formatDuration,
  filters: STOP_FILTERS,
  initialFilter: STOP_FILTERS.map(f => f.name),
  aggregation: 'sum',
  mode: 'stacked',
};

export const DELAY_METRIC: StatsMetric = {
  name: 'delay',
  label: 'RETARD',
  yAxis: (
    metricFilter: string,
    dayStats: PlanDayStats,
    operations: Operation[],
    constants: Constants
  ) => getDelays(dayStats, operations, constants, metricFilter as TeamTypes, 'all'),
  renderY: formatDuration,
  filters: MORNING_AFTERNOON_FILTERS,
  initialFilter: ['all'],
  aggregation: 'sum',
  mode: 'separated',
};
