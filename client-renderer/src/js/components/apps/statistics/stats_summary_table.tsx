import {sum, max} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {LoadingIndicator} from '@root/components/core/loading_indicator';
import {WithConstants} from '@root/components/core/with_constants';
import {processStatsData} from '@root/lib/statistics/data';
import {StatsMetric} from '@root/lib/statistics/metrics';
import {StatsPeriod} from '@root/lib/statistics/period';
import {Palette, Colors, FontWeight} from '@root/theme';

import {StatsData, ProdRange, Operation} from '@shared/models';

interface StatsSummaryTableProps {
  prodHours: Map<string, ProdRange>;
  operations: Operation[];
  statsData: StatsData;
  statsPeriod: StatsPeriod;
  statsMetric: StatsMetric;
  date: number;
}

export class StatsSummaryTable extends React.Component<StatsSummaryTableProps> {
  public static displayName = 'StatsSummaryTable';

  public render(): JSX.Element {
    const {statsData, date, prodHours, operations, statsPeriod, statsMetric} = this.props;

    return (
      <WithConstants>
        {constants => {
          if (!constants) {
            return <LoadingIndicator size="large" />;
          }
          return (
            <StatsSummaryTableElement>
              <thead>
                <tr>
                  <th />
                  <StatsSummaryTableHeaderCell>Total</StatsSummaryTableHeaderCell>
                  <StatsSummaryTableHeaderCell>Moyenne</StatsSummaryTableHeaderCell>
                  <StatsSummaryTableHeaderCell>Maximum</StatsSummaryTableHeaderCell>
                </tr>
              </thead>
              <tbody>
                {statsMetric.filters.map(filter => {
                  const data = processStatsData(
                    statsData,
                    prodHours,
                    operations,
                    constants,
                    statsPeriod,
                    date,
                    statsMetric,
                    filter
                  );
                  return (
                    <tr>
                      <FilterLabelCell style={{backgroundColor: filter.color}}>
                        {filter.label}
                      </FilterLabelCell>
                      <StatsSummaryDataCell>{statsMetric.renderY(sum(data))}</StatsSummaryDataCell>
                      <StatsSummaryDataCell>
                        {statsMetric.renderY(Math.round(sum(data) / data.length))}
                      </StatsSummaryDataCell>
                      <StatsSummaryDataCell>
                        {statsMetric.renderY(max(data) || 0)}
                      </StatsSummaryDataCell>
                    </tr>
                  );
                })}
              </tbody>
            </StatsSummaryTableElement>
          );
        }}
      </WithConstants>
    );
  }
}

const StatsSummaryTableElement = styled.table`
  margin: auto;
`;

const StatsSummaryTableCellBase = styled.td`
  padding: 4px 12px;
`;

const StatsSummaryDataCell = styled(StatsSummaryTableCellBase)`
  background-color: ${Palette.White};
  text-align: center;
`;

const StatsSummaryTableHeaderCell = styled.th`
  padding: 4px 12px;
  background-color: ${Colors.SecondaryDark};
  color: ${Colors.TextOnSecondary};
  font-weight: ${FontWeight.SemiBold};
`;

const FilterLabelCell = styled(StatsSummaryTableCellBase)`
  color: ${Palette.White};
`;
