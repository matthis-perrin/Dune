import {sum, flatten} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {Gauge} from '@root/components/common/gauge';
import {LoadingIndicator} from '@root/components/core/loading_indicator';
import {MAX_SPEED, MAX_SPEED_RATIO} from '@root/lib/constants';
import {computeStatsData} from '@root/lib/statistics/data';
import {
  UNPLANNED_STOP_FILTER,
  PLANNED_STOP_FILTER,
  MAINTENANCE_STOP_FILTER,
  NON_PROD_STOP_FILTER,
  MetricFilter,
  PROD_STOP_FILTER,
  getStops,
  getMetrages,
  TeamTypes,
  getDelays,
} from '@root/lib/statistics/metrics';
import {formatDuration, numberWithSeparator} from '@root/lib/utils';
import {Palette, Colors} from '@root/theme';

import {startOfDay} from '@shared/lib/utils';
import {Schedule, Operation, StatsData, PlanDayStats} from '@shared/models';

interface DayStatsProps {
  day: number;
  team: MetricFilter;
  schedule?: Schedule;
  operations?: Operation[];
}

export class DayStats extends React.Component<DayStatsProps> {
  public static displayName = 'DayStats';

  private aggregate(
    statsData: StatsData,
    date: number,
    aggregation: 'sum' | 'avg',
    dayDataProcessor: (planDayStats: PlanDayStats) => number[]
  ): number {
    const dayStats = statsData.days.get(date);
    if (!dayStats) {
      return 0;
    }
    const values = dayStats.map(dayDataProcessor);
    const flatValues = flatten(values);
    return aggregation === 'sum' ? sum(flatValues) : sum(flatValues) / flatValues.length;
  }

  public renderLine(value: string, label: string, color: string): JSX.Element {
    return (
      <StatLine style={{backgroundColor: color}} key={label}>
        <StatLabel>{label}</StatLabel>
        <StatValue>{value}</StatValue>
      </StatLine>
    );
  }

  public renderDurationLine(
    value: number,
    label: string,
    color: string,
    hideWhenNull?: boolean
  ): JSX.Element {
    if (value === 0 && hideWhenNull) {
      return <React.Fragment />;
    }
    return this.renderLine(formatDuration(value, true), label, color);
  }

  public render(): JSX.Element {
    const {day, team, schedule, operations} = this.props;
    if (!schedule || !operations) {
      return <LoadingIndicator size="medium" />;
    }

    const dataDay = startOfDay(new Date(day)).getTime();
    const statsData = computeStatsData(schedule);

    const metrageDone = this.aggregate(statsData, dataDay, 'sum', dayStatsData =>
      getMetrages(dayStatsData, team.name as TeamTypes)
    );

    const [unplannedDone, plannedDone, maintenanceDone, nonProdDone, prodDone] = [
      UNPLANNED_STOP_FILTER.name,
      PLANNED_STOP_FILTER.name,
      MAINTENANCE_STOP_FILTER.name,
      NON_PROD_STOP_FILTER.name,
      PROD_STOP_FILTER.name,
    ].map(stopFilter =>
      this.aggregate(statsData, dataDay, 'sum', dayStatsData =>
        getStops(dayStatsData, team.name as TeamTypes, stopFilter)
      )
    );

    const stopDone = unplannedDone + plannedDone + maintenanceDone + nonProdDone;
    const activePeriod = stopDone + prodDone;
    const activePeriodMetrage = (activePeriod * MAX_SPEED) / (60 * 1000);

    const delays = this.aggregate(statsData, dataDay, 'sum', dayStatsData =>
      getDelays(dayStatsData, operations, team.name as TeamTypes, 'all')
    );

    return (
      <Column>
        <GaugeWrapper>
          <Gauge ratio={metrageDone / activePeriodMetrage} ratioMax={MAX_SPEED_RATIO} />
        </GaugeWrapper>
        <StatGroups>
          <StatGroup>
            {this.renderDurationLine(
              unplannedDone,
              UNPLANNED_STOP_FILTER.label,
              UNPLANNED_STOP_FILTER.color
            )}
            {this.renderDurationLine(
              plannedDone,
              PLANNED_STOP_FILTER.label,
              PLANNED_STOP_FILTER.color
            )}
            {this.renderDurationLine(
              maintenanceDone,
              MAINTENANCE_STOP_FILTER.label,
              MAINTENANCE_STOP_FILTER.color,
              true
            )}
            {this.renderDurationLine(
              nonProdDone,
              NON_PROD_STOP_FILTER.label,
              NON_PROD_STOP_FILTER.color,
              true
            )}
            {this.renderDurationLine(prodDone, PROD_STOP_FILTER.label, PROD_STOP_FILTER.color)}
          </StatGroup>
          <StatGroup>
            {this.renderDurationLine(delays, 'Retards', Colors.Danger)}
            {this.renderLine(
              `${numberWithSeparator(metrageDone)} m`,
              'Mètres Linéaires',
              Colors.SecondaryDark
            )}
            {this.renderDurationLine(stopDone, 'Arrêts Cumulés', Colors.SecondaryDark)}
          </StatGroup>
        </StatGroups>
      </Column>
    );
  }
}

const Column = styled.div`
  display: flex;
  flex-direction: column;
`;

const GaugeWrapper = styled.div`
  margin-bottom: 16px;
`;

const StatGroups = styled.div`
  display: flex;
  align-item: flex-start;
`;

const StatGroup = styled.div`
  flex-basis: 1px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  &:first-of-type {
    margin-right: 8px;
  }
`;
const StatLine = styled.div`
  width: 100%;
  box-sizing: border-box;
  height: 24px;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 0 4px;
  margin-bottom: 2px;
  &:last-of-type {
    margin-bottom: 0;
  }
  color: ${Palette.White};
`;

const StatLabel = styled.div``;

const StatValue = styled.div``;