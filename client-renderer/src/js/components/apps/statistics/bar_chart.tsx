import Chart from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import {isEqual, sum} from 'lodash-es';
import React from 'react';
import styled from 'styled-components';

import {PlottableStatsCSS} from '@root/components/charts/plottable_css';
import {Palette, FontWeight} from '@root/theme';

import {StatsData, PlanDayStats, ProdRange} from '@shared/models';

interface BarDataSet {
  color: string;
  data: Datum[];
}

interface Datum {
  value: number;
  days: string;
}

export interface BarChartConfig {
  xAxis(stats: StatsData, prodHours: Map<string, ProdRange>, date: number): number[][];
  yAxis(dayStats: PlanDayStats): {values: number[]; color: string}[];
  renderX(days: number[]): string;
  renderY(value: number): string;
  aggregation: 'sum' | 'avg';
  mode: 'separated' | 'stacked';
}

interface BarChartProps {
  statsData: StatsData;
  prodHours: Map<string, ProdRange>;
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
  private readonly chartRef = React.createRef<HTMLCanvasElement>();
  private chart: Chart | undefined = undefined;

  public componentDidMount(): void {
    this.createChart();
  }

  public componentDidUpdate(prevProps: BarChartProps): void {
    if (!isEqual(this.props, prevProps)) {
      this.createChart();
    }
  }

  private createChart(): void {
    // Check this is a good time to render
    const chartElement = this.chartRef.current;
    if (!chartElement) {
      setTimeout(() => this.createChart(), 100);
      return;
    }

    if (this.chart) {
      // tslint:disable-next-line: no-inferred-empty-object-type
      this.chart.destroy();
    }

    // Data
    const {statsData, prodHours, chartConfig, date} = this.props;

    const xAxisDates = chartConfig.xAxis(statsData, prodHours, date);

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
                [] as {values: number[]; color: string}[]
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
          const valuesForColor = xValueDataMap.get(barData.color);
          if (!valuesForColor) {
            xValueDataMap.set(barData.color, barData.values);
          } else {
            xValueDataMap.set(barData.color, valuesForColor.concat(barData.values));
          }
        })
      );

      xValueDataMap.forEach((values, color) => {
        let aggregation = 0;
        if (chartConfig.aggregation === 'sum') {
          aggregation = sum(values);
        }
        if (chartConfig.aggregation === 'avg') {
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

    const datalabelsConf =
      chartConfig.mode === 'stacked'
        ? {
            color: Palette.White,
          }
        : // Sorry, I don't remember what this 40 correspond to
        // tslint:disable-next-line:no-magic-numbers
        barDataSets.length === 0 || barDataSets.length * barDataSets[0].data.length > 40
        ? {
            rotation: -90,
            anchor: 'start' as 'start',
            align: 'top' as 'top',
            color: Palette.White,
            textStrokeWidth: 3,
            textStrokeColor: Palette.Black,
          }
        : {
            anchor: 'end' as 'end',
            align: 'top' as 'top',
            offset: -4,
            rotation: 0,
            color: Palette.Black,
            textStrokeWidth: 3,
            textStrokeColor: Palette.White,
          };

    // Chart
    this.chart = new Chart(chartElement, {
      type: 'bar',
      data: {
        labels: barDataSets.length > 0 ? barDataSets[0].data.map(datum => datum.days) : [],
        datasets: barDataSets.map(dataSet => ({
          backgroundColor: dataSet.color,
          data: dataSet.data.map(datum => datum.value),
          stack: chartConfig.mode === 'stacked' ? 'stackId' : undefined,
        })),
      },
      plugins: [ChartDataLabels],
      options: {
        plugins: {
          datalabels: {
            ...datalabelsConf,
            font: {family: 'Segoe UI', weight: FontWeight.SemiBold},
            formatter: chartConfig.renderY,
            display: a => ((a.dataset.data || [])[a.dataIndex] || 0) !== 0,
          },
        },
        elements: {
          rectangle: {
            backgroundColor: 'red',
          },
        },
        layout: {padding: {left: 16, right: 16, top: 16}},
        responsive: true,
        legend: {display: false},
        maintainAspectRatio: false,
        tooltips: {
          enabled: false,
        },
        scales: {
          yAxes: [{display: false}],
          xAxes: [
            {
              ticks: {fontColor: Palette.Black},
            },
          ],
        },
      },
    });
  }

  public updateChart(): void {
    this.createChart();
  }

  public render(): JSX.Element {
    return (
      <React.Fragment>
        <PlottableStatsCSS />
        <ChartContainer>
          <Canvas ref={this.chartRef} />
        </ChartContainer>
      </React.Fragment>
    );
  }
}

const ChartContainer = styled.div`
  width: 100%;
  height: 100%;
  box-sizing: border-box;
`;
const Canvas = styled.canvas`
  background-color: white;
`;
