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

export interface SpeedChartEvent {
  start: number;
  end: number;
  color: string;
}

interface SpeedChartProps {
  speeds: SpeedTime[];
  day: number;
  prodRange: ProdRange;
  lastTimeSpeed: SpeedTime | undefined;
  events: SpeedChartEvent[];
}

interface Datum {
  start: Date;
  end: Date;
  speed: number | undefined;
  isNow: boolean;
}

const BAR_THICKNESS_RATIO = 1.05;
const EVENTS_OPACITY = 0.5;
const NULL_SPEED_HEIGHT = 10;
const THRESHOLD_SPREAD_FOR_MINUTE_DETAILS = 15;

// Those should be extracted it in the constant file shared with the server
const SPEED_AGGREGATION_TIME_MS = 5000;
const SPEED_STOP_THRESHOLD = 50;
const EVENT_FAKE_SPEED = 50;

// tslint:disable:no-magic-numbers
const PLOT_SPEED_MAX = 200;
const PLOT_SPEED_RANGE = [0, PLOT_SPEED_MAX];
const PLOT_SPEED_TICKS = [0, 50, 100, 150, 180];
// tslint:enable:no-magic-numbers

Plottable.Plots.Bar._BAR_THICKNESS_RATIO = BAR_THICKNESS_RATIO;

export class SpeedChart extends React.Component<SpeedChartProps> {
  public static displayName = 'SpeedChart';
  private readonly chartRef = React.createRef<HTMLDivElement>();
  private plot: Plottable.Components.Table | undefined = undefined;
  private lastData: Datum[] = [];
  private lastEvents: SpeedChartEvent[] = [];
  private barDataset: Plottable.Dataset | undefined = undefined;
  private eventDataset: Plottable.Dataset | undefined = undefined;

  public componentDidMount(): void {
    window.addEventListener('resize', this.handleResize);
    this.createChart();
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
    const {day, speeds, prodRange, lastTimeSpeed} = this.props;

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
    let currentMinute = Math.floor(rangeStart / (60 * 1000));
    let currentSpeeds: SpeedTime[] = [];
    for (let time = rangeStart; time <= rangeEnd; time += SPEED_AGGREGATION_TIME_MS) {
      const loopMinute = Math.floor(time / (60 * 1000));
      const loopSpeed = speedMap.get(time);
      if (loopMinute === currentMinute) {
        if (loopSpeed !== undefined) {
          currentSpeeds.push({time, speed: loopSpeed});
        }
      } else {
        if (this.shouldDisplayMinuteDetail(currentSpeeds)) {
          currentSpeeds.forEach(s =>
            data.push({
              start: new Date(s.time),
              end: new Date(s.time + SPEED_AGGREGATION_TIME_MS),
              speed: s.speed,
              isNow: lastTimeSpeed !== undefined && s.time === lastTimeSpeed.time,
            })
          );
        } else {
          const definedSpeed = removeUndefined(currentSpeeds.map(s => s.speed));
          const speedSum = definedSpeed.length === 0 ? undefined : sum(definedSpeed);
          data.push({
            start: new Date(currentMinute * 60 * 1000),
            end: new Date((currentMinute + 1) * 60 * 1000),
            speed: speedSum === undefined ? undefined : speedSum / currentSpeeds.length,
            isNow: false,
          });
        }
        currentMinute = loopMinute;
        currentSpeeds = [{time, speed: loopSpeed}];
      }
    }
    return data;
  }

  private getColorForSpeed(speed: number | undefined): string {
    return speed === undefined
      ? Palette.Asbestos
      : speed < SPEED_STOP_THRESHOLD
      ? Palette.Alizarin
      : Palette.Nephritis;
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

    // Scales
    const firstDate = data[0].start;
    const lastDate = data[data.length - 1].start;
    const xScale = new Plottable.Scales.Time().domain([new Date(firstDate), new Date(lastDate)]);
    const yScale = new Plottable.Scales.Linear().domain(PLOT_SPEED_RANGE);
    yScale.defaultTicks = () => PLOT_SPEED_TICKS;

    // Check if we should recreate the chart
    const filteredEvents = this.props.events.filter(
      e => e.start >= firstDate.getTime() && e.end <= lastDate.getTime()
    );
    if (isEqual(this.lastData, data) && isEqual(this.lastEvents, filteredEvents)) {
      return;
    }
    this.lastData = data;
    this.lastEvents = filteredEvents;

    // Bars
    this.barDataset = new Plottable.Dataset(data);
    const bars = new Plottable.Plots.Rectangle<Date, number>()
      .addDataset(this.barDataset)
      .x((d: Datum) => d.start, xScale)
      .x2((d: Datum) => d.end)
      .y(() => 0, yScale)
      .y2((d: Datum) => (d.speed !== undefined ? d.speed : NULL_SPEED_HEIGHT))
      .attr('fill', (d: Datum) => this.getColorForSpeed(d.speed))
      .attr('stroke', (d: Datum) => (d.isNow ? this.getColorForSpeed(d.speed) : 'transparent'));

    // Events
    this.eventDataset = new Plottable.Dataset(filteredEvents);
    const events = new Plottable.Plots.Rectangle<Date, number>()
      .addDataset(this.eventDataset)
      .x((s: SpeedChartEvent) => new Date(s.start), xScale)
      .x2((s: SpeedChartEvent) => new Date(s.end))
      .y(() => 0, yScale)
      .y2(() => EVENT_FAKE_SPEED)
      .attr('fill', (s: SpeedChartEvent) => s.color)
      .attr('opacity', EVENTS_OPACITY);

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
    const center = new Plottable.Components.Group([events, gridline, bars]);
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
    if (this.barDataset && this.eventDataset) {
      const data = this.normalizeSpeeds();
      const firstDate = data[0].start;
      const lastDate = data[data.length - 1].start;
      const filteredEvents = this.props.events.filter(
        e => e.start >= firstDate.getTime() && e.end <= lastDate.getTime()
      );
      this.barDataset.data(data);
      this.eventDataset.data(filteredEvents);
    }
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
