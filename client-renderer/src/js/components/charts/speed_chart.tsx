import {isEqual, sum} from 'lodash-es';
import * as Plottable from 'plottable';
import React from 'react';
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
  // AP
  machine: string;
}

interface Datum {
  start: Date;
  end: Date;
  speed: number | undefined;
  isNow: boolean;
}

interface Param {
  plotSpeedRange: number[];
  plotSpeedTicks: number[];
  // Those should be extracted it in the constant file shared with the server
  speedAggregationTimeMs: number;
  speedStopThreshold: number;
  eventFakeSpeed: number;
  eventsOpacity: number;
  nullSpeedHeight: number;
  thresholdSpreadForMinuteDetails: number;
}

// AP
const mondonOption: Param = {
  // tslint:disable:no-magic-numbers
  plotSpeedRange: [0, 200],
  plotSpeedTicks: [0, 50, 100, 150, 180],
  speedAggregationTimeMs: 5000,
  speedStopThreshold: 50,
  eventFakeSpeed: 50,
  eventsOpacity: 0.5,
  nullSpeedHeight: 10,
  thresholdSpreadForMinuteDetails: 15,
  // tslint:enable:no-magic-numbers
};

// AP
const giaveOption: Param = {
  // tslint:disable:no-magic-numbers
  plotSpeedRange: [0, 200],
  plotSpeedTicks: [0, 50, 100, 150, 180],
  speedAggregationTimeMs: 5000,
  speedStopThreshold: 50,
  eventFakeSpeed: 50,
  eventsOpacity: 0.5,
  nullSpeedHeight: 10,
  thresholdSpreadForMinuteDetails: 15,
  // tslint:enable:no-magic-numbers
};

const BAR_THICKNESS_RATIO = 1.05;
Plottable.Plots.Bar._BAR_THICKNESS_RATIO = BAR_THICKNESS_RATIO;

export class SpeedChart extends React.Component<SpeedChartProps> {
  public static displayName = 'SpeedChart';
  private readonly chartRef = React.createRef<HTMLDivElement>();
  private plot: Plottable.Components.Table | undefined = undefined;
  private lastData: Datum[] = [];
  private lastEvents: SpeedChartEvent[] = [];

  private barDataset: Plottable.Dataset | undefined = undefined;
  private eventDataset: Plottable.Dataset | undefined = undefined;
  private pziXAxis: Plottable.Interactions.PanZoom | undefined = undefined;
  private xAxis: Plottable.Axes.Time | undefined = undefined;
  private bars: Plottable.Plots.Rectangle<Date, number> | undefined = undefined;
  private previousStart: Date | undefined = undefined;
  private previousEnd: Date | undefined = undefined;

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

  // AP
  private getOption(machine: string): Param {
    if (machine === 'mondon') {
      return mondonOption;
    }
    return giaveOption;
  }

  private readonly handleResize = (): void => {
    if (!this.plot) {
      return;
    }
    this.plot.redraw();
  };

  private shouldDisplayMinuteDetail(minute: SpeedTime[]): boolean {
    // AP
    const option = this.getOption(this.props.machine);
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
    // AP
    return max - min > option.thresholdSpreadForMinuteDetails;
  }

  private normalizeSpeeds(): Datum[] {
    // AP
    const option = this.getOption(this.props.machine);
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
    // AP
    for (let time = rangeStart; time <= rangeEnd; time += option.speedAggregationTimeMs) {
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
              // AP
              end: new Date(s.time + option.speedAggregationTimeMs),
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
    // AP
    const option = this.getOption(this.props.machine);
    return speed === undefined
      ? Palette.Asbestos
      : // AP
      speed < option.speedStopThreshold
      ? Palette.Alizarin
      : Palette.Nephritis;
  }

  private createChart(): void {
    // AP
    const option = this.getOption(this.props.machine);
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
    const lastDate = data[data.length - 1].end;
    this.previousStart = firstDate;
    this.previousEnd = lastDate;
    const xScale = new Plottable.Scales.Time().domain([new Date(firstDate), new Date(lastDate)]);
    // AP
    const yScale = new Plottable.Scales.Linear().domain(option.plotSpeedRange);
    yScale.defaultTicks = () => option.plotSpeedTicks;

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
    this.bars = new Plottable.Plots.Rectangle<Date, number>()
      .addDataset(this.barDataset)
      .x((d: Datum) => d.start, xScale)
      .x2((d: Datum) => d.end)
      .y(() => 0, yScale)
      // AP
      .y2((d: Datum) => (d.speed !== undefined ? d.speed : option.nullSpeedHeight))
      .attr('fill', (d: Datum) => this.getColorForSpeed(d.speed))
      .attr('stroke', (d: Datum) => (d.isNow ? this.getColorForSpeed(d.speed) : 'transparent'));

    // Events
    this.eventDataset = new Plottable.Dataset(filteredEvents);
    const events = new Plottable.Plots.Rectangle<Date, number>()
      .addDataset(this.eventDataset)
      .x((s: SpeedChartEvent) => new Date(s.start), xScale)
      .x2((s: SpeedChartEvent) => new Date(s.end))
      .y(() => 0, yScale)
      // AP
      .y2(() => option.eventFakeSpeed)
      .attr('fill', (s: SpeedChartEvent) => s.color)
      // AP
      .attr('opacity', option.eventsOpacity);

    // Axis
    const hourSplit = 10;
    this.xAxis = new Plottable.Axes.Time(xScale, 'bottom').axisConfigurations([
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
    const center = new Plottable.Components.Group([events, gridline, this.bars]);
    this.plot = new Plottable.Components.Table([
      [yAxis, center],
      [undefined, this.xAxis],
    ]);

    // Gesture
    this.pziXAxis = new Plottable.Interactions.PanZoom();
    this.pziXAxis
      .addXScale(xScale)
      .minDomainValue(xScale, firstDate.getTime())
      .maxDomainValue(xScale, lastDate.getTime());
    this.pziXAxis.attachTo(this.xAxis);
    this.pziXAxis.attachTo(this.bars);

    // Rendering
    chartElement.innerHTML = '';
    this.plot.renderTo(chartElement);
  }

  public updateChart(): void {
    if (this.barDataset && this.eventDataset) {
      const data = this.normalizeSpeeds();
      const firstDate = data[0].start;
      const lastDate = data[data.length - 1].end;

      if (
        this.previousStart !== undefined &&
        this.previousEnd !== undefined &&
        this.previousStart.getTime() === firstDate.getTime() &&
        this.previousEnd.getTime() === lastDate.getTime()
      ) {
        this.previousStart = firstDate;
        this.previousEnd = lastDate;
        const filteredEvents = this.props.events.filter(
          e => e.start >= firstDate.getTime() && e.end <= lastDate.getTime()
        );
        this.barDataset.data(data);
        this.eventDataset.data(filteredEvents);
      } else {
        this.createChart();
      }
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
