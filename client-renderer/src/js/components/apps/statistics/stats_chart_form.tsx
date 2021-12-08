import * as React from 'react';
import styled from 'styled-components';

import {BarChart} from '@root/components/apps/statistics/bar_chart';
import {BarFilter} from '@root/components/apps/statistics/bar_filter';
import {LoadingIndicator} from '@root/components/core/loading_indicator';
import {WithConstants} from '@root/components/core/with_constants';
import {StatsMetric, MetricFilter} from '@root/lib/statistics/metrics';
import {StatsPeriod} from '@root/lib/statistics/period';

import {StatsData, ProdRange, PlanDayStats, Operation} from '@shared/models';

interface StatsChartFormProps {
  prodHours: Map<string, ProdRange>;
  operations: Operation[];
  statsData: StatsData;
  statsPeriod: StatsPeriod;
  statsMetric: StatsMetric;
  date: number;
}

interface StatsChartFormState {
  selectedMetricFilterNames: string[];
}

export class StatsChartForm extends React.Component<StatsChartFormProps, StatsChartFormState> {
  public static displayName = 'StatsChartForm';

  public constructor(props: StatsChartFormProps) {
    super(props);
    this.state = {
      selectedMetricFilterNames: props.statsMetric.initialFilter,
    };
  }

  public componentDidUpdate(prevProps: StatsChartFormProps): void {
    if (this.props.statsMetric !== prevProps.statsMetric) {
      this.setState({selectedMetricFilterNames: this.props.statsMetric.initialFilter});
    }
  }

  private getSelectedMetricFilters(selectedMetricFilterNames: string[]): MetricFilter[] {
    const {statsMetric} = this.props;
    return statsMetric.filters.filter(({name}) => selectedMetricFilterNames.indexOf(name) !== -1);
  }

  public render(): JSX.Element {
    const {statsData, date, prodHours, operations, statsPeriod, statsMetric} = this.props;
    const {selectedMetricFilterNames} = this.state;
    return (
      <WithConstants>
        {constants => {
          if (!constants) {
            return <LoadingIndicator size="large" />;
          }
          return (
            <StatChartFormWrapper>
              <BarFilterWrapper>
                <BarFilter
                  barTypes={statsMetric.filters}
                  checked={selectedMetricFilterNames}
                  onChange={newFilterName =>
                    this.setState({selectedMetricFilterNames: newFilterName})
                  }
                />
              </BarFilterWrapper>
              <BarChartWrapper>
                <BarChart
                  statsData={statsData}
                  prodHours={prodHours}
                  date={date}
                  chartConfig={{
                    aggregation: statsMetric.aggregation,
                    mode: statsMetric.mode,
                    renderX: statsPeriod.renderX,
                    renderY: statsMetric.renderY,
                    xAxis: statsPeriod.xAxis,
                    yAxis: (dayStats: PlanDayStats) =>
                      this.getSelectedMetricFilters(selectedMetricFilterNames).map(
                        metricFilter => ({
                          values: statsMetric.yAxis(
                            metricFilter.name,
                            dayStats,
                            operations,
                            constants
                          ),
                          color: metricFilter.color,
                        })
                      ),
                  }}
                />
              </BarChartWrapper>
            </StatChartFormWrapper>
          );
        }}
      </WithConstants>
    );
  }
}
const StatChartFormWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;
const BarFilterWrapper = styled.div`
  flex-shrink: 0;
  margin-bottom: 16px;
`;
const BarChartWrapper = styled.div`
  flex-grow: 1;
`;
