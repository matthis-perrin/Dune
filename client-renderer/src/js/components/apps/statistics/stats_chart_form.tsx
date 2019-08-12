import * as React from 'react';

import {BarChart} from '@root/components/apps/statistics/bar_chart';
import {BarFilter} from '@root/components/apps/statistics/bar_filter';
import {StatsMetric, MetricFilter} from '@root/lib/statistics/metrics';
import {StatsPeriod} from '@root/lib/statistics/period';

import {StatsData, ProdRange, PlanDayStats} from '@shared/models';

interface StatsChartFormProps {
  prodHours: Map<string, ProdRange>;
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
      selectedMetricFilterNames: [props.statsMetric.initialFilter],
    };
  }

  private getSelectedMetricFilters(selectedMetricFilterNames: string[]): MetricFilter[] {
    const {statsMetric} = this.props;
    return statsMetric.filters.filter(({name}) => selectedMetricFilterNames.indexOf(name) !== -1);
  }

  public render(): JSX.Element {
    const {statsData, date, prodHours, statsPeriod, statsMetric} = this.props;
    const {selectedMetricFilterNames} = this.state;
    return (
      <div>
        <BarFilter
          barTypes={statsMetric.filters}
          checked={selectedMetricFilterNames}
          onChange={selectedMetricFilterNames => this.setState({selectedMetricFilterNames})}
        />
        <BarChart
          statsData={statsData}
          prodHours={prodHours}
          date={date}
          chartConfig={{
            mode: 'sum',
            renderX: statsPeriod.renderX,
            renderY: statsMetric.renderY,
            xAxis: statsPeriod.xAxis,
            yAxis: (dayStats: PlanDayStats) =>
              this.getSelectedMetricFilters(selectedMetricFilterNames).map(metricFilter => ({
                value: statsMetric.yAxis(metricFilter.name, dayStats),
                color: metricFilter.color,
              })),
          }}
        />
      </div>
    );
  }
}
