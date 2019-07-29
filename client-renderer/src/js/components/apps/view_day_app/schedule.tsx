import {min, max} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {PlanProdBlock} from '@root/components/apps/view_day_app/plan_prod_block';
import {WithColor} from '@root/components/core/with_colors';
import {getSchedulesForDay} from '@root/lib/schedule_utils';
import {isRoundHour, isHalfHour, padNumber} from '@root/lib/utils';
import {theme} from '@root/theme';

import {dateAtHour} from '@shared/lib/time';
import {Stock, ProdRange, Schedule, PlanProdSchedule, Stop, Color, Prod} from '@shared/models';

interface ScheduleViewProps {
  day: Date;
  schedule?: Schedule;
  stocks?: Map<string, Stock[]>;
  prodRanges?: Map<string, ProdRange>;
}

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
    const WIDTH = 980;
    const hourLabelLeftMargin = 16;
    const hourLabelOffsetFromLine = 8;
    const hourLineStyles: React.SVGProps<SVGLineElement> = {
      stroke: '#000',
      strokeWidth: 1,
    };
    const halfHourLineStyles: React.SVGProps<SVGLineElement> = {
      stroke: '#aaa',
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
          <line key={current} x1={0} y1={distance} x2={WIDTH} y2={distance} {...hourLineStyles} />
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
            x2={WIDTH}
            y2={distance}
            {...halfHourLineStyles}
          />
        );
      }
      current += 30 * 60 * 1000;
    }

    return (
      <svg style={{position: 'absolute'}} width={WIDTH} height={height}>
        {svgComponents}
      </svg>
    );
  }

  private getPositionStyleForDates(start: Date, end: Date): React.CSSProperties {
    const left = 96;
    const right = 96;
    const width = 980 - left - right;
    const top = this.getYPosForTime(start.getTime());
    const bottom = this.getYPosForTime(end.getTime());
    const height = bottom - top - 1; // -1 for the border
    return {
      position: 'absolute',
      top,
      left,
      height,
      width,
    };
  }

  // private renderPlanProd(
  //   planStart: Date,
  //   planEnd: Date,
  //   couleurPapier: string | undefined,
  //   children: JSX.Element | JSX.Element[]
  // ): JSX.Element {
  //   const {start, end} = this.getScheduleRange();
  //   const adjustedStart = Math.max(start, planStart.getTime());
  //   const adjustedEnd = Math.min(end, planEnd.getTime());
  //   return (
  //     <WithColor color={couleurPapier}>
  //       {color => (
  //         <div
  //           style={{
  //             ...this.getPositionStyleForDates(new Date(adjustedStart), new Date(adjustedEnd)),
  //             backgroundColor: color.backgroundHex,
  //             border: 'solid 1px black',
  //             borderRadius: 16,
  //           }}
  //         >
  //           {children}
  //         </div>
  //       )}
  //     </WithColor>
  //   );
  // }

  private renderStop(stop: Stop, color: Color): JSX.Element {
    if (!stop.end) {
      console.log(stop);
      throw new Error('invalid stop');
    }
    return (
      <StopWrapper
        style={{
          ...this.getPositionStyleForDates(new Date(stop.start), new Date(stop.end)),
          backgroundColor: color.backgroundHex,
          border: 'solid 1px black',
        }}
      >
        STOP
        {stop.stopType} - {(stop.end - stop.start) / 1000} - {(stop.end - stop.start) / 60000}
      </StopWrapper>
    );
  }

  private renderProd(prod: Prod, color: Color): JSX.Element {
    if (!prod.end) {
      console.log(prod);
      throw new Error('invalid prod');
    }
    return (
      <StopWrapper
        style={{
          ...this.getPositionStyleForDates(new Date(prod.start), new Date(prod.end)),
          backgroundColor: color.backgroundHex,
          border: 'solid 1px black',
        }}
      >
        PROD
        {prod.avgSpeed} - {(prod.end - prod.start) / 1000} - {(prod.end - prod.start) / 60000}
      </StopWrapper>
    );
  }

  private renderPlanProdSchedule(planSchedule: PlanProdSchedule): JSX.Element {
    return (
      <WithColor color={planSchedule.planProd.data.papier.couleurPapier}>
        {color => (
          <React.Fragment>
            {([] as JSX.Element[])
              .concat(planSchedule.stops.map(s => this.renderStop(s, color)))
              .concat(planSchedule.plannedStops.map(s => this.renderStop(s, color)))
              .concat(planSchedule.prods.map(p => this.renderProd(p, color)))
              .concat(planSchedule.plannedProds.map(p => this.renderProd(p, color)))}
          </React.Fragment>
        )}
      </WithColor>
    );
  }

  private renderPlanProds(): JSX.Element[] {
    const {schedule, day} = this.props;
    console.log(schedule);
    if (!schedule) {
      return [];
    }
    return schedule.plans.map(p => {
      const planSchedule = p.schedulePerDay.get(dateAtHour(day, 0).getTime());
      return planSchedule ? this.renderPlanProdSchedule(planSchedule) : <React.Fragment />;
    });
  }

  public render(): JSX.Element {
    // Little hack where we compute the schedule range here and store it on a class property so
    // it is available to the other render methods. This avoids computing it too many times.
    this.scheduleRange = this.getScheduleRange();
    return (
      <div style={{position: 'relative'}}>
        {this.renderHours()}
        {this.renderPlanProds()}
      </div>
    );
  }
}

const StopWrapper = styled.div``;
