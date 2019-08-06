import {min, max} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {WithColor} from '@root/components/core/with_colors';
import {getPlanProdTitle, getShortPlanProdTitle} from '@root/lib/plan_prod';
import {getSchedulesForDay} from '@root/lib/schedule_utils';
import {getColorForStopType, getLabelForStopType} from '@root/lib/stop';
import {isRoundHour, isHalfHour, padNumber, isSameDay, numberWithSeparator} from '@root/lib/utils';
import {theme, Palette, FontWeight} from '@root/theme';

import {dateAtHour} from '@shared/lib/time';
import {
  Stock,
  ProdRange,
  Schedule,
  PlanProdSchedule,
  Stop,
  Color,
  Prod,
  StopType,
  PlanProductionStatus,
} from '@shared/models';

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
    const left = paddingLeft + sideBlockWidth;
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
        fontSize: 19,
        fontWeight: FontWeight.Regular,
      };
    }
    if (height >= 30) {
      return {
        fontSize: 15,
        fontWeight: FontWeight.Regular,
      };
    }
    if (height >= 17) {
      return {
        fontSize: 11,
        lineHeight: '14px',
        fontWeight: FontWeight.SemiBold,
      };
    }
    return {display: 'none'};
    // tslint:enable:no-magic-number
  }

  private getTitleForHeight(schedule: PlanProdSchedule, height: number): JSX.Element {
    const id = schedule.planProd.id;
    const showMetrage = schedule.status !== PlanProductionStatus.PLANNED;
    // tslint:disable:no-magic-number
    let title = <React.Fragment />;
    const metrage = (
      <PlanTitleMetrage>{`${numberWithSeparator(
        Math.round(schedule.doneProdMeters)
      )} m`}</PlanTitleMetrage>
    );
    if (height >= 180) {
      title = <PlanTitleId>{getPlanProdTitle(id)}</PlanTitleId>;
    } else if (height >= 50) {
      title = <PlanTitleId>{getShortPlanProdTitle(id)}</PlanTitleId>;
    }
    return (
      <React.Fragment>
        {title}
        {showMetrage ? metrage : <React.Fragment />}
      </React.Fragment>
    );
    // tslint:enable:no-magic-number
  }

  private getStripesForColor(
    backgroundColor: string,
    stripesColor: string = 'rgba(0, 0, 0, 0.5)'
  ): string {
    const stripesSize = 10;
    return `${backgroundColor} repeating-linear-gradient(
      -45deg,
      ${stripesColor},
      ${stripesColor} ${stripesSize}px,
      transparent ${stripesSize}px,
      transparent ${2 * stripesSize}px
    )`;
  }

  private renderMinuteDuration(duration: number): JSX.Element {
    const minutes = Math.round(duration / (60 * 1000));
    return (
      <React.Fragment>
        <MinuteValue>{minutes}</MinuteValue>
        <MinuteLabel> min</MinuteLabel>
      </React.Fragment>
    );
  }

  private renderDurationLabel(duration: number, height: number): JSX.Element {
    if (height < 17) {
      return <React.Fragment />;
    }
    if (height < 47) {
      const lineHeight = duration < 7.5 * 60 * 1000 ? {lineHeight: '14px'} : {};
      return (
        <HorizontalDuration style={lineHeight}>
          {this.renderMinuteDuration(duration)}
        </HorizontalDuration>
      );
    }
    const hours = Math.floor(duration / (60 * 60 * 1000));
    const minutes = Math.round((duration - hours * 60 * 60 * 1000) / (60 * 1000));
    const minutesStr = padNumber(minutes, 2);

    if (hours === 0) {
      return <VerticalDuration>{this.renderMinuteDuration(duration)}</VerticalDuration>;
    }

    return <VerticalDuration>{`${hours}h${minutesStr}`}</VerticalDuration>;
  }

  private renderStop(stop: Stop, color: Color, isPlanned: boolean): JSX.Element {
    if (!stop.end) {
      console.log(stop);
      throw new Error('invalid stop');
    }
    const stopLabel = getLabelForStopType(stop.stopType);
    const positionStyles = this.getPositionStyleForDates(new Date(stop.start), new Date(stop.end));
    const durationLabel = this.renderDurationLabel(
      stop.end - stop.start,
      positionStyles.height as number
    );
    const labelTextStyles = this.getTextStyleForDates(new Date(stop.start), new Date(stop.end));
    return (
      <React.Fragment>
        <StopWrapper
          style={{
            ...positionStyles,
            background: this.getStripesForColor(
              color.backgroundHex,
              stop.stopType === StopType.Unplanned ? getColorForStopType(stop.stopType) : undefined
            ),
            opacity: isPlanned ? PLANNED_EVENT_OPACITY : 1,
          }}
        >
          <StopLabel style={labelTextStyles}>{stopLabel}</StopLabel>
        </StopWrapper>
        <DurationWrapper
          style={{
            ...positionStyles,
            backgroundColor: getColorForStopType(stop.stopType),

            left: `calc(100% - ${paddingRight}px - 2px)`,
            width: sideBlockWidth,
            opacity: isPlanned ? PLANNED_EVENT_OPACITY : 1,
          }}
        >
          {durationLabel}
        </DurationWrapper>
      </React.Fragment>
    );
  }

  private renderProd(prod: Prod, color: Color, isPlanned: boolean): JSX.Element {
    if (!prod.end) {
      console.log(prod);
      throw new Error('invalid prod');
    }
    // const meters = roundedToDigit(computeMetrage(prod.end - prod.start, prod.avgSpeed || 0), 1);
    const start = new Date(prod.start);
    const end = new Date(prod.end);
    const labelPositionStyles = this.getPositionStyleForDates(start, end, 2);
    const positionStyles = this.getPositionStyleForDates(start, end);
    const durationLabel = this.renderDurationLabel(
      prod.end - prod.start,
      positionStyles.height as number
    );
    return (
      <React.Fragment>
        <ProdWrapper
          style={{
            ...positionStyles,
            backgroundColor: color.backgroundHex,
            color: color.textHex,
            opacity: isPlanned ? PLANNED_EVENT_OPACITY : 1,
          }}
        />
        <DurationWrapper
          style={{
            ...labelPositionStyles,
            backgroundColor: color.backgroundHex,
            top: (labelPositionStyles.top as number) - 1,
            left: `calc(100% - ${paddingRight}px - 2px)`,
            width: sideBlockWidth,
            opacity: isPlanned ? PLANNED_EVENT_OPACITY : 1,
          }}
        >
          {durationLabel}
        </DurationWrapper>
      </React.Fragment>
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
              .concat(planSchedule.stops.map(s => this.renderStop(s, color, false)))
              .concat(planSchedule.plannedStops.map(s => this.renderStop(s, color, true)))
              .concat(planSchedule.prods.map(p => this.renderProd(p, color, false)))
              .concat(planSchedule.plannedProds.map(p => this.renderProd(p, color, true)))}
            <PlanProdBorder
              style={{
                ...planBorderPosition,
                width: `calc(100% - ${paddingLeft + paddingRight}px - ${planBorderThickness}px)`,
              }}
            />
            <PlanTitle
              style={{
                ...planBorderPosition,
                width: sideBlockWidth,
                left: paddingLeft,
                background: color.backgroundHex,
              }}
            >
              {this.getTitleForHeight(planSchedule, planBorderPosition.height as number)}
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
      const {lastSpeedTime} = schedule;
      if (lastSpeedTime && isSameDay(new Date(day), new Date(lastSpeedTime.minute))) {
        const left = paddingLeft;
        const right = paddingRight;
        const width = `calc(100% - ${left + right}px)`;
        const top = this.getYPosForTime(lastSpeedTime.minute);
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
const sideBlockWidth = 56;
const paddingLeft = 72;
const paddingRight = 72;

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
const StopWrapper = styled(EventWrapper)`
  border-top: solid 1px ${Palette.Black};
  border-bottom: solid 1px ${Palette.Black};
`;
const ProdWrapper = styled(EventWrapper)``;

const StopLabel = styled.span`
  background-color: rgba(255, 255, 255, 0.75);
  padding: 2px 12px;
  border-radius: 4px;
`;

const MinuteValue = styled.div``;
const MinuteLabel = styled.div`
  font-size: 11px;
  margin-inline-start: 2px;
`;
const DurationWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border: solid 2px ${Palette.Black};
  border-top-width: 1px;
  border-bottom-width: 1px;
  box-sizing: border-box;
`;
const Duration = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: ${FontWeight.SemiBold};
  background: rgba(255, 2555, 255, 0.5);
  border-radius: 4px;
  padding-inline-start: 4px;
  padding-inline-end: 4px;
`;
const HorizontalDuration = styled(Duration)``;
const VerticalDuration = styled(Duration)`
  writing-mode: vertical-rl;
  transform: rotate(-180deg);
  margin-left: -4px;
`;

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
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: ${FontWeight.SemiBold};
  box-sizing: border-box;
`;

const PlanTitleId = styled.div``;

const PlanTitleMetrage = styled.div``;

const CurrentTimeLine = styled.div`
  background-color: red;
`;
