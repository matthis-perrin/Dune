import {isEqual, sum} from 'lodash-es';
import * as Plottable from 'plottable';
import * as React from 'react';
import styled from 'styled-components';

import {PlottableStatsCSS} from '@root/components/charts/plottable_css';

import {StatsData, PlanDayStats} from '@shared/models';
import {asString} from '@shared/type_utils';

interface BarDataSet {
  color: string;
  data: Datum[];
}

interface Datum {
  value: number;
  days: string;
}

export interface BarChartConfig {
  xAxis(stats: StatsData, date: number): number[][];
  yAxis(dayStats: PlanDayStats): {value: number; color: string}[];
  renderX(days: number[]): string;
  renderY(value: number): string;
  mode: 'sum' | 'average';
}

interface BarChartProps {
  statsData: StatsData;
  chartConfig: BarChartConfig;
  date: number;
}

const emptyPlanDayStats: PlanDayStats = {
  afternoonProds: [],
  afternoonStops: [],
  morningProds: [],
  morningStops: [],
  planTotalOperationDone: 0,
  planTotalOperationPlanned: 0,
  repriseProdDone: 0,
};

export class BarChart extends React.Component<BarChartProps> {
  public static displayName = 'BarChart';
  private readonly chartRef = React.createRef<HTMLDivElement>();
  private plot: Plottable.Components.Table | undefined = undefined;

  public componentDidMount(): void {
    window.addEventListener('resize', this.handleResize);
    this.createChart();
  }

  public componentWillUnmount(): void {
    window.removeEventListener('resize', this.handleResize);
  }

  public componentDidUpdate(prevProps: BarChartProps): void {
    if (!isEqual(this.props, prevProps)) {
      this.updateChart();
    }
  }

  private readonly handleResize = (): void => {
    if (!this.plot) {
      return;
    }
    this.plot.redraw();
  };

  private createChart(): void {
    // Check this is a good time to render
    const chartElement = this.chartRef.current;
    if (!chartElement) {
      setTimeout(() => this.createChart(), 100);
      return;
    }

    // Data
    const {statsData, chartConfig, date} = this.props;
    const xAxisDates = chartConfig.xAxis(statsData, date);

    const dataSets = new Map<string, Datum[]>();
    const colorOrder: string[] = [];

    xAxisDates.forEach(days => {
      const xValueDataMap = new Map<string, number[]>();

      const yValues = days.map(day => {
        const planDayStats = statsData.days.get(day) || [];
        const barsDataForDay =
          planDayStats.length > 0
            ? planDayStats.reduce(
                (acc, planDayStat) => acc.concat(chartConfig.yAxis(planDayStat)),
                [] as {value: number; color: string}[]
              )
            : chartConfig.yAxis(emptyPlanDayStats);
        return barsDataForDay;
      });

      if (yValues.length === 0) {
        return;
      }

      // First pass to group colors and values
      yValues.forEach(yValue =>
        yValue.forEach(barData => {
          if (colorOrder.indexOf(barData.color) === -1) {
            colorOrder.push(barData.color);
          }
          let valuesForColor = xValueDataMap.get(barData.color);
          if (!valuesForColor) {
            valuesForColor = [];
            xValueDataMap.set(barData.color, valuesForColor);
          }
          valuesForColor.push(barData.value);
        })
      );

      xValueDataMap.forEach((values, color) => {
        let aggregation = 0;
        if (chartConfig.mode === 'sum') {
          aggregation = sum(values);
        }
        if (chartConfig.mode === 'average') {
          aggregation = sum(values) / values.length;
        }

        if (colorOrder.indexOf(color) === -1) {
          colorOrder.push(color);
        }
        let colorDataSet = dataSets.get(color);
        if (!colorDataSet) {
          colorDataSet = [];
          dataSets.set(color, colorDataSet);
        }
        colorDataSet.push({days: chartConfig.renderX(days), value: aggregation});
      });
    });

    const barDataSets: BarDataSet[] = [];
    colorOrder.forEach(c => {
      const data = dataSets.get(c);
      if (data) {
        barDataSets.push({color: c, data});
      }
    });

    // Scales
    const xScale = new Plottable.Scales.Category();
    const yScale = new Plottable.Scales.Linear();

    // Bars
    const barPlot = new Plottable.Plots.ClusteredBar();
    barDataSets.forEach(barDataSet =>
      barPlot.addDataset(new Plottable.Dataset(barDataSet.data).metadata(barDataSet.color))
    );
    barPlot
      .x((d: Datum) => d.days, xScale)
      .y((d: Datum) => d.value, yScale)
      .attr('fill', (d, i, ds) => asString(ds.metadata(), 'black'))
      .labelsEnabled(true)
      .labelFormatter(chartConfig.renderY);

    // Axis
    const xAxis = new Plottable.Axes.Category(xScale, 'bottom');

    // Final Plot
    this.plot = new Plottable.Components.Table([[barPlot], [xAxis]]);

    // Rendering
    chartElement.innerHTML = '';
    this.plot.renderTo(chartElement);
  }

  public updateChart(): void {
    this.createChart();
  }

  public render(): JSX.Element {
    return (
      <React.Fragment>
        <PlottableStatsCSS />
        <ChartContainer ref={this.chartRef} />
      </React.Fragment>
    );
  }
}

const ChartContainer = styled.div`
  width: 100%;
  height: 384px;
`;
