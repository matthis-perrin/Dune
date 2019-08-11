import {isEqual, sum} from 'lodash-es';
import * as Plottable from 'plottable';
import * as React from 'react';
import styled from 'styled-components';

import {PlottableSpeedCSS} from '@root/components/charts/plottable_css';
import {Palette} from '@root/theme';

import {dateAtHour} from '@shared/lib/time';
import {padNumber} from '@shared/lib/utils';
import {SpeedTime, ProdRange} from '@shared/models';
import {removeUndefined} from '@shared/type_utils';

interface SpeedChartProps {
  speeds: SpeedTime[];
  day: number;
  prodRange: ProdRange;
}

type Datum = [Date, Date, number | undefined];

const BAR_THICKNESS_RATIO = 1.05;
const NULL_SPEED_HEIGHT = 10;
const THRESHOLD_SPREAD_FOR_MINUTE_DETAILS = 15;

// Those should be extracted it in the constant file shared with the server
const SPEED_AGGREGATION_TIME_MS = 5000;
const SPEED_STOP_THRESHOLD = 50;

// tslint:disable:no-magic-numbers
const PLOT_SPEED_RANGE = [0, 200];
const PLOT_SPEED_TICKS = [0, 50, 100, 150, 180];
// tslint:enable:no-magic-numbers

Plottable.Plots.Bar._BAR_THICKNESS_RATIO = BAR_THICKNESS_RATIO;

export class SpeedChart extends React.Component<SpeedChartProps> {
  public static displayName = 'SpeedChart';
  private readonly chartRef = React.createRef<HTMLDivElement>();
  private plot: Plottable.Components.Table | undefined = undefined;
  private dataset: Plottable.Dataset | undefined = undefined;
  private lastData: Datum[] = [];

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

  private shouldDisplayMinuteDetail(minute: SpeedTime[]): boolean {
    let hasNull = false;
    let hasZero = false;
    let hasPositive = false;
    let min = 300;
    let max = 0;
    for (const s of minute) {
      if (s.speed !== undefined && s.speed > 0) {
        hasPositive = true;
        min = Math.min(s.speed, min);
        max = Math.max(s.speed, max);
      } else if (s.speed === undefined) {
        hasNull = true;
      } else {
        hasZero = true;
      }
    }
    if ((hasNull && hasZero) || (hasZero && hasPositive) || (hasPositive && hasNull)) {
      return true;
    }
    if (!hasPositive) {
      return false;
    }
    return max - min > THRESHOLD_SPREAD_FOR_MINUTE_DETAILS;
  }

  private normalizeSpeeds(): Datum[] {
    const {day, speeds, prodRange} = this.props;

    const speedMap = new Map<number, number | undefined>();
    speeds.forEach(({time, speed}) => speedMap.set(time, speed));

    let rangeStart = dateAtHour(
      new Date(day),
      prodRange.startHour,
      prodRange.startMinute
    ).getTime();
    let rangeEnd = dateAtHour(new Date(day), prodRange.endHour, prodRange.endMinute).getTime();

    const positiveSpeeds = speeds.filter(s => s.speed !== undefined && s.speed > 0);

    const firstSpeed = positiveSpeeds[0];
    const lastSpeed = positiveSpeeds[positiveSpeeds.length - 1];
    if (firstSpeed && firstSpeed.time < rangeStart) {
      rangeStart = firstSpeed.time;
    }
    if (lastSpeed && lastSpeed.time > rangeEnd) {
      rangeEnd = lastSpeed.time;
    }

    const data: Datum[] = [];
    let currentMinute = Math.floor(rangeStart / 60000);
    let currentSpeeds: SpeedTime[] = [];
    for (let time = rangeStart; time <= rangeEnd; time += SPEED_AGGREGATION_TIME_MS) {
      const loopMinute = Math.floor(time / 60000);
      const loopSpeed = speedMap.get(time);
      if (loopMinute === currentMinute) {
        if (loopSpeed !== undefined) {
          currentSpeeds.push({time, speed: loopSpeed});
        }
      } else {
        if (this.shouldDisplayMinuteDetail(currentSpeeds)) {
          currentSpeeds.forEach(s =>
            data.push([new Date(s.time), new Date(s.time + SPEED_AGGREGATION_TIME_MS), s.speed])
          );
        } else {
          const definedSpeed = removeUndefined(currentSpeeds.map(s => s.speed));
          const speedSum = sum(definedSpeed);
          data.push([
            new Date(currentMinute * 60000),
            new Date((currentMinute + 1) * 60000),
            speedSum === undefined ? undefined : speedSum / currentSpeeds.length,
          ]);
        }
        currentMinute = loopMinute;
        currentSpeeds = [{time, speed: loopSpeed}];
      }
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

    // Data
    const data = this.normalizeSpeeds();
    if (isEqual(this.lastData, data)) {
      return;
    }
    this.lastData = data;

    // Scales
    const firstDate = data[0][0];
    const lastDate = data[data.length - 1][0];
    const xScale = new Plottable.Scales.Time().domain([new Date(firstDate), new Date(lastDate)]);
    const yScale = new Plottable.Scales.Linear().domain(PLOT_SPEED_RANGE);
    yScale.defaultTicks = () => PLOT_SPEED_TICKS;

    // Bars
    // if (this.plot && this.dataset) {
    //   this.dataset.data(data);
    //   this.plot.redraw();
    //   return;
    // }

    this.dataset = new Plottable.Dataset(data);
    const bars = new Plottable.Plots.Rectangle<Date, number>()
      .addDataset(this.dataset)
      .x((d: Datum) => d[0], xScale)
      .x2((d: Datum) => d[1])
      .y(() => 0, yScale)
      .y2((d: Datum) => (d[2] !== undefined ? d[2] : NULL_SPEED_HEIGHT))
      .attr('fill', (d: Datum) =>
        d[2] === undefined
          ? Palette.Asbestos
          : d[2] < SPEED_STOP_THRESHOLD
          ? Palette.Alizarin
          : Palette.Nephritis
      );

    // Axis
    const hourSplit = 10;
    const xAxis = new Plottable.Axes.Time(xScale, 'bottom').axisConfigurations([
      [
        {
          interval: 'second',
          step: 5,
          formatter: (date: Date) =>
            `${padNumber(date.getHours(), 2)}:${padNumber(date.getMinutes(), 2)}:${padNumber(
              date.getSeconds(),
              2
            )}`,
        },
      ],
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
    // tslint:disable-next-line:no-any
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
