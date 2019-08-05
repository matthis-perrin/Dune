import {isEqual} from 'lodash-es';
import * as Plottable from 'plottable';
import * as React from 'react';
import styled from 'styled-components';

import {PlottableSpeedCSS} from '@root/components/charts/plottable_css';
import {padNumber} from '@root/lib/utils';
import {Palette} from '@root/theme';

import {dateAtHour, roundToMiddleOfMinute} from '@shared/lib/time';
import {MinuteSpeed, ProdRange} from '@shared/models';

interface SpeedChartProps {
  speeds: MinuteSpeed[];
  day: number;
  prodRange: ProdRange;
}

type Datum = [Date, number | undefined];

Plottable.Plots.Bar._BAR_THICKNESS_RATIO = 1.05;

export class SpeedChart extends React.Component<SpeedChartProps> {
  public static displayName = 'SpeedChart';
  private readonly chartRef = React.createRef<HTMLDivElement>();
  private plot: Plottable.Components.Table | undefined = undefined;

  public componentDidMount(): void {
    window.addEventListener('resize', this.handleResize);
    this.createChart();
    this.updateChart();
  }

  public componentWillUnmount(): void {
    window.removeEventListener('resize', this.handleResize);
  }

  public componentDidUpdate(prevProps: SpeedChartProps): void {
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

  private normalizeSpeeds(): Datum[] {
    const {day, speeds, prodRange} = this.props;

    const speedMap = new Map<number, number | undefined>();
    speeds.forEach(({minute, speed}) => speedMap.set(roundToMiddleOfMinute(minute), speed));

    let rangeStart = dateAtHour(
      new Date(day),
      prodRange.startHour,
      prodRange.startMinute
    ).getTime();
    let rangeEnd = dateAtHour(new Date(day), prodRange.endHour, prodRange.endMinute).getTime();

    const positiveSpeeds = speeds.filter(s => s.speed !== undefined && s.speed > 0);

    const firstSpeed = positiveSpeeds[0];
    const lastSpeed = positiveSpeeds[positiveSpeeds.length - 1];
    if (firstSpeed && firstSpeed.minute < rangeStart) {
      rangeStart = firstSpeed.minute;
    }
    if (lastSpeed && lastSpeed.minute > rangeEnd) {
      rangeEnd = lastSpeed.minute;
    }

    rangeStart = roundToMiddleOfMinute(rangeStart) - 30 * 60 * 1000;
    rangeEnd = roundToMiddleOfMinute(rangeEnd) + 30 * 60 * 1000;

    const data: Datum[] = [];
    for (let time = rangeStart; time <= rangeEnd; time += 60 * 1000) {
      data.push([new Date(time), speedMap.get(time)]);
    }
    return data;
  }

  private createChart(): void {
    // Check this is a good time to render
    const chartElement = this.chartRef.current;
    if (!chartElement) {
      setTimeout(() => this.createChart(), 100);
      return;
    }

    // Scales
    const data = this.normalizeSpeeds();
    const firstDate = data[0][0];
    const lastDate = data[data.length - 1][0];
    const xScale = new Plottable.Scales.Time().domain([new Date(firstDate), new Date(lastDate)]);
    const yScale = new Plottable.Scales.Linear().domain([0, 200]);
    yScale.defaultTicks = () => [0, 50, 100, 150, 180];

    // Bars
    const bars = new Plottable.Plots.Bar<Date, number>()
      .addDataset(new Plottable.Dataset(data))
      .x((d: Datum) => d[0], xScale)
      .y((d: Datum) => (d[1] !== undefined ? d[1] : 10), yScale)
      .attr('fill', (d: Datum) =>
        d[1] === undefined ? Palette.Asbestos : d[1] < 50 ? Palette.Alizarin : Palette.Nephritis
      );

    // Axis
    const hourSplit = 10;
    const xAxis = new Plottable.Axes.Time(xScale, 'bottom').axisConfigurations([
      [
        {
          interval: 'minute',
          step: 1,
          formatter: (date: Date) =>
            `${padNumber(date.getHours(), 2)}:${padNumber(date.getMinutes(), 2)}`,
        },
      ],
      [
        {
          interval: 'minute',
          step: hourSplit,
          formatter: (date: Date) =>
            `${padNumber(date.getHours(), 2)}:${padNumber(
              date.getMinutes() - (date.getMinutes() % hourSplit),
              2
            )}`,
        },
      ],
      [
        {
          interval: 'hour',
          step: 1,
          formatter: (date: Date) => `${padNumber(date.getHours(), 2)}:00`,
        },
      ],
    ]);
    const yAxis = new Plottable.Axes.Numeric(yScale, 'left');
    (yAxis as any)._hasOverlapWithInterval = () => true;

    // Grid lines
    const gridline = new Plottable.Components.Gridlines(xScale, yScale);

    // Final Plot
    const center = new Plottable.Components.Group([gridline, bars]);
    this.plot = new Plottable.Components.Table([[yAxis, center], [undefined, xAxis]]);

    // Gesture
    const pziXAxis = new Plottable.Interactions.PanZoom();
    pziXAxis
      .addXScale(xScale)
      .minDomainValue(xScale, firstDate.getTime())
      .maxDomainValue(xScale, lastDate.getTime());
    pziXAxis.attachTo(xAxis);
    pziXAxis.attachTo(bars);

    // Rendering
    chartElement.innerHTML = '';
    this.plot.renderTo(chartElement);
  }

  public updateChart(): void {
    this.createChart();
    // if (this.plot) {
    //   this.plot.redraw();
    // }
  }

  public render(): JSX.Element {
    return (
      <React.Fragment>
        <PlottableSpeedCSS />
        <ChartContainer ref={this.chartRef} />
      </React.Fragment>
    );
  }
}

const ChartContainer = styled.div`
  width: 100%;
  height: 100%;
`;
