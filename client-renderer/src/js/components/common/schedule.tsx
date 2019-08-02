import {min, max} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {WithColor} from '@root/components/core/with_colors';
import {getPlanProdTitle, getShortPlanProdTitle} from '@root/lib/plan_prod';
import {computeMetrage} from '@root/lib/prod';
import {getSchedulesForDay} from '@root/lib/schedule_utils';
import {getColorForStopType, getLabelForStopType} from '@root/lib/stop';
import {isRoundHour, isHalfHour, padNumber, isSameDay, roundedToDigit} from '@root/lib/utils';
import {theme, Palette, FontWeight} from '@root/theme';

import {dateAtHour} from '@shared/lib/time';
import {Stock, ProdRange, Schedule, PlanProdSchedule, Stop, Color, Prod} from '@shared/models';

interface ScheduleViewProps {
  day: Date;
  schedule?: Schedule;
  stocks?: Map<string, Stock[]>;
  prodRanges?: Map<string, ProdRange>;
}

const PLANNED_EVENT_OPACITY = 0.75;

export class ScheduleView extends React.Component<ScheduleViewProps> {
  public static displayName = 'ScheduleView';

  private scheduleRange: {start: number; end: number};

  constructor(props: ScheduleViewProps) {
    super(props);
    this.scheduleRange = this.getScheduleRange();
  }

  public getProdHours(): {start: Date; end: Date} {
    const defaultStartHour = 1;
    const defaultEndHour = 23;
    const {day, prodRanges} = this.props;
    if (!prodRanges) {
      return {start: dateAtHour(day, defaultStartHour), end: dateAtHour(day, defaultEndHour)};
    }
    const dayOfWeek = day.toLocaleString('fr-FR', {weekday: 'long'});
    const prodHours = prodRanges.get(dayOfWeek);
    if (!prodHours) {
      return {start: dateAtHour(day, defaultStartHour), end: dateAtHour(day, defaultEndHour)};
    }
    return {
      start: dateAtHour(day, prodHours.startHour, prodHours.startMinute),
      end: dateAtHour(day, prodHours.endHour, prodHours.endMinute),
    };
  }

  private getScheduleRange(): {start: number; end: number} {
    const {start, end} = this.getProdHours();
    const {schedule, day} = this.props;
    if (!schedule) {
      return {start: start.getTime(), end: end.getTime()};
    }
    const planSchedules = getSchedulesForDay(schedule, day);
    const scheduleStarts = planSchedules.map(s => s.start);
    const scheduleEnds = planSchedules.map(s => s.end);
    const minStart = Math.min(min(scheduleStarts) || start.getTime(), start.getTime());
    const maxEnd = Math.max(max(scheduleEnds) || end.getTime(), end.getTime());
    return {start: minStart, end: maxEnd};
  }

  private getYPosForTime(time: number): number {
    const {start} = this.scheduleRange;
    return (
      theme.schedule.verticalPadding + (theme.schedule.hourHeight * (time - start)) / 1000 / 3600
    );
  }

  private renderHours(): JSX.Element {
    const hourLabelLeftMargin = 16;
    const hourLabelOffsetFromLine = 8;
    const hourLineStyles: React.SVGProps<SVGLineElement> = {
      stroke: '#000000',
      strokeWidth: 1,
    };
    const halfHourLineStyles: React.SVGProps<SVGLineElement> = {
      stroke: '#AAAAAA',
      strokeWidth: 1,
    };

    const svgComponents: JSX.Element[] = [];

    const {start, end} = this.scheduleRange;

    const height =
      2 * theme.schedule.verticalPadding +
      (theme.schedule.hourHeight * (end - start)) / 1000 / 3600;

    let current = start;
    while (current <= end) {
      const distance = this.getYPosForTime(current);
      const currentDate = new Date(current);
      if (isRoundHour(currentDate)) {
        svgComponents.push(
          <line key={current} x1={0} y1={distance} x2={'100%'} y2={distance} {...hourLineStyles} />
        );
        svgComponents.push(
          <text x={hourLabelLeftMargin} y={distance - hourLabelOffsetFromLine}>
            {`${padNumber(currentDate.getHours(), 2)}:00`}
          </text>
        );
      }
      if (isHalfHour(currentDate)) {
        svgComponents.push(
          <line
            key={current}
            x1={0}
            y1={distance}
            x2={'100%'}
            y2={distance}
            {...halfHourLineStyles}
          />
        );
      }
      current += 30 * 60 * 1000;
    }

    return (
      <HoursSVG style={{position: 'absolute'}} height={height} width="100%">
        {svgComponents}
      </HoursSVG>
    );
  }

  private getPositionStyleForDates(
    start: Date,
    end: Date,
    borderSize: number = 0
  ): React.CSSProperties {
    const left = paddingLeft + planTitleWidth;
    const width = `calc(100% - ${left + paddingRight}px)`;
    const top = this.getYPosForTime(start.getTime());
    const bottom = this.getYPosForTime(end.getTime());
    const height = bottom - top + borderSize;
    return {
      position: 'absolute',
      top,
      left,
      height,
      width,
    };
  }

  private getTextStyleForDates(start: Date, end: Date): React.CSSProperties | undefined {
    const top = this.getYPosForTime(start.getTime());
    const bottom = this.getYPosForTime(end.getTime());
    const height = bottom - top;
    // tslint:disable:no-magic-number
    if (height >= 60) {
      return {
        fontSize: 20,
        fontWeight: FontWeight.Regular,
      };
    }
    if (height >= 30) {
      return {
        fontSize: 15,
        fontWeight: FontWeight.Regular,
      };
    }
    if (height >= 13) {
      return {
        fontSize: 11,
        fontWeight: FontWeight.SemiBold,
      };
    }
    if (height >= 9) {
      return {
        fontSize: 9,
        fontWeight: FontWeight.SemiBold,
      };
    }
    if (height >= 5) {
      return {
        fontSize: 7,
        fontWeight: FontWeight.Bold,
      };
    }
    return {fontSize: 0};
    // tslint:enable:no-magic-number
  }

  private getPlanProdTitleForHeight(id: number, height: number): string {
    // tslint:disable:no-magic-number
    if (height >= 200) {
      return getPlanProdTitle(id);
    }
    if (height >= 50) {
      return getShortPlanProdTitle(id);
    }
    return '';
    // tslint:enable:no-magic-number
  }

  private getStripesForColor(color: string): string {
    const stripesSize = 10;
    const stripesColor = 'rgba(0, 0, 0, 0.2)';
    return `${color} repeating-linear-gradient(
      -45deg,
      ${stripesColor},
      ${stripesColor} ${stripesSize}px,
      transparent ${stripesSize}px,
      transparent ${2 * stripesSize}px
    )`;
  }

  private renderStop(stop: Stop, isPlanned: boolean): JSX.Element {
    if (!stop.end) {
      console.log(stop);
      throw new Error('invalid stop');
    }
    const stopLabel = getLabelForStopType(stop.stopType);
    const durationMinutes = roundedToDigit((stop.end - stop.start) / 60000, 1);
    return (
      <StopWrapper
        style={{
          ...this.getPositionStyleForDates(new Date(stop.start), new Date(stop.end)),
          ...this.getTextStyleForDates(new Date(stop.start), new Date(stop.end)),
          background: this.getStripesForColor(getColorForStopType(stop.stopType)),
          opacity: isPlanned ? PLANNED_EVENT_OPACITY : 1,
        }}
      >
        {`${stopLabel} : ${durationMinutes} min`}
      </StopWrapper>
    );
  }

  private renderProd(prod: Prod, color: Color, isPlanned: boolean): JSX.Element {
    if (!prod.end) {
      console.log(prod);
      throw new Error('invalid prod');
    }
    const avgSpeed = roundedToDigit(prod.avgSpeed || 0, 1);
    const meters = roundedToDigit(computeMetrage(prod.end - prod.start, prod.avgSpeed || 0), 1);
    const durationMinutes = roundedToDigit((prod.end - prod.start) / 60000, 1);
    return (
      <ProdWrapper
        style={{
          ...this.getPositionStyleForDates(new Date(prod.start), new Date(prod.end)),
          ...this.getTextStyleForDates(new Date(prod.start), new Date(prod.end)),
          backgroundColor: color.backgroundHex,
          color: color.textHex,
          opacity: isPlanned ? PLANNED_EVENT_OPACITY : 1,
        }}
      >
        {`PROD à ${avgSpeed} m/s - ${durationMinutes} min - ${meters} m`}
      </ProdWrapper>
    );
  }

  private renderPlanProdSchedule(planSchedule: PlanProdSchedule): JSX.Element {
    const planBorderPosition = this.getPositionStyleForDates(
      new Date(planSchedule.start),
      new Date(planSchedule.end),
      planBorderThickness
    );
    return (
      <WithColor color={planSchedule.planProd.data.papier.couleurPapier}>
        {color => (
          <React.Fragment>
            {([] as JSX.Element[])
              .concat(planSchedule.stops.map(s => this.renderStop(s, false)))
              .concat(planSchedule.plannedStops.map(s => this.renderStop(s, true)))
              .concat(planSchedule.prods.map(p => this.renderProd(p, color, false)))
              .concat(planSchedule.plannedProds.map(p => this.renderProd(p, color, true)))}
            <PlanProdBorder style={planBorderPosition} />
            <PlanTitle
              style={{
                ...planBorderPosition,
                width: planTitleWidth,
                left: paddingLeft,
                background: color.backgroundHex,
              }}
            >
              {this.getPlanProdTitleForHeight(
                planSchedule.planProd.id,
                planBorderPosition.height as number
              )}
            </PlanTitle>
          </React.Fragment>
        )}
      </WithColor>
    );
  }

  private renderPlanProds(): JSX.Element[] {
    const {schedule, day} = this.props;
    if (!schedule) {
      return [];
    }
    return schedule.plans.map(p => {
      const planSchedule = p.schedulePerDay.get(dateAtHour(day, 0).getTime());
      return planSchedule ? this.renderPlanProdSchedule(planSchedule) : <React.Fragment />;
    });
  }

  private renderCurrentTimeIndicator(): JSX.Element {
    const {schedule, day} = this.props;
    if (schedule) {
      const {lastMinuteSpeed} = schedule;
      if (lastMinuteSpeed && isSameDay(new Date(day), new Date(lastMinuteSpeed.minute))) {
        const left = paddingLeft;
        const right = paddingRight;
        const width = `calc(100% - ${left + right}px)`;
        const top = this.getYPosForTime(lastMinuteSpeed.minute);
        const height = 1;
        return (
          <CurrentTimeLine
            style={{
              position: 'absolute',
              top,
              left,
              height,
              width,
            }}
          />
        );
      }
    }
    return <React.Fragment />;
  }

  public render(): JSX.Element {
    // Little hack where we compute the schedule range here and store it on a class property so
    // it is available to the other render methods. This avoids computing it too many times.
    this.scheduleRange = this.getScheduleRange();
    return (
      <ScheduleWrapper>
        {this.renderHours()}
        {this.renderPlanProds()}
        {this.renderCurrentTimeIndicator()}
      </ScheduleWrapper>
    );
  }
}

const planBorderThickness = 2;
const planTitleWidth = 48;
const paddingLeft = 96;
const paddingRight = 96;

const ScheduleWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const EventWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  box-sizing: border-box;
  text-align: center;
`;
const StopWrapper = styled(EventWrapper)``;
const ProdWrapper = styled(EventWrapper)``;

const HoursSVG = styled.svg`
  background-color: ${Palette.Clouds};
`;

const PlanProdBorder = styled.div`
  border: solid ${planBorderThickness}px black;
  border-left: none;
  box-sizing: border-box;
`;

const PlanTitle = styled.div`
  border: solid ${planBorderThickness}px black;
  writing-mode: vertical-rl;
  transform: rotate(-180deg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: ${FontWeight.SemiBold};
  box-sizing: border-box;
`;

const CurrentTimeLine = styled.div`
  background-color: red;
`;
