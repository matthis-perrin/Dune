import * as React from 'react';

import {PlanProdBlock} from '@root/components/apps/view_day_app/plan_prod_block';
import {WithColor} from '@root/components/core/with_colors';
import {
  PlansProdOrder,
  DonePlanProduction,
  InProgressPlanProduction,
  ScheduledPlanProduction,
} from '@root/lib/plan_prod_order';
import {isRoundHour, isHalfHour, padNumber, isSameDay} from '@root/lib/utils';
import {theme} from '@root/theme';

import {dateAtHour} from '@shared/lib/time';
import {Stock, BobineQuantities, PlanProduction, Operation, ProdRange} from '@shared/models';

interface ScheduleProps {
  day: Date;
  orderedPlans?: PlansProdOrder;
  stocks?: Map<string, Stock[]>;
  cadencier?: Map<string, Map<number, number>>;
  bobineQuantities?: BobineQuantities[];
  plansProd?: PlanProduction[];
  operations?: Operation[];
  prodRanges?: Map<string, ProdRange>;
}

export class Schedule extends React.Component<ScheduleProps> {
  public static displayName = 'Schedule';

  private scheduleRange: {start: number; end: number};

  constructor(props: ScheduleProps) {
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
    const {orderedPlans, day} = this.props;
    if (!orderedPlans) {
      return {start: start.getTime(), end: end.getTime()};
    }
    const {done, inProgress, scheduled} = orderedPlans;
    let minStart = start.getTime();
    let maxEnd = end.getTime();
    const checkStartTime = (startTime: number | undefined) => {
      if (startTime && isSameDay(new Date(startTime), day) && startTime < minStart) {
        minStart = startTime;
      }
    };
    const checkEndTime = (endTime: number | undefined) => {
      if (endTime && isSameDay(new Date(endTime), day) && endTime > maxEnd) {
        maxEnd = endTime;
      }
    };
    done.forEach(p => {
      checkStartTime(p.plan.startTime);
      checkEndTime(p.plan.endTime);
      checkEndTime(p.plan.stopTime);
    });
    if (inProgress) {
      checkStartTime(inProgress.plan.startTime);
      checkEndTime(inProgress.plan.stopTime);
      checkEndTime(inProgress.end.getTime());
    }
    scheduled.forEach(p => {
      checkStartTime(p.estimatedReglageStart.getTime());
      checkEndTime(p.estimatedProductionEnd.getTime());
    });
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

  private renderPlanProd(
    planStart: Date,
    planEnd: Date,
    couleurPapier: string | undefined,
    children: JSX.Element | JSX.Element[]
  ): JSX.Element {
    const {start, end} = this.getScheduleRange();
    const adjustedStart = Math.max(start, planStart.getTime());
    const adjustedEnd = Math.min(end, planEnd.getTime());
    console.log(couleurPapier);
    return (
      <WithColor color={couleurPapier}>
        {color => (
          <div
            style={{
              ...this.getPositionStyleForDates(new Date(adjustedStart), new Date(adjustedEnd)),
              backgroundColor: color.backgroundHex,
              border: 'solid 1px black',
              borderRadius: 16,
            }}
          >
            {children}
          </div>
        )}
      </WithColor>
    );
  }

  private renderDonePlanProd(donePlanProd: DonePlanProduction): JSX.Element {
    const inner = <span>Done</span>;
    return this.renderPlanProd(
      donePlanProd.start,
      donePlanProd.end,
      donePlanProd.plan.data.papier.couleurPapier,
      inner
    );
  }

  private renderInProgressPlanProd(inProgressPlanProd: InProgressPlanProduction): JSX.Element {
    const inner = <span>In Progress</span>;
    return this.renderPlanProd(
      inProgressPlanProd.start,
      inProgressPlanProd.end,
      inProgressPlanProd.plan.data.papier.couleurPapier,
      inner
    );
  }

  private renderScheduledPlanProd(scheduledPlanProd: ScheduledPlanProduction): JSX.Element {
    const inner = <PlanProdBlock planProd={scheduledPlanProd} />;
    return this.renderPlanProd(
      scheduledPlanProd.start,
      scheduledPlanProd.end,
      scheduledPlanProd.plan.data.papier.couleurPapier,
      inner
    );
  }

  private renderPlanProds(): JSX.Element[] {
    const {orderedPlans} = this.props;
    if (!orderedPlans) {
      return [];
    }
    console.log(orderedPlans);
    const {done, inProgress, scheduled} = orderedPlans;
    const planProdElements: JSX.Element[] = [];
    done.forEach(plan => planProdElements.push(this.renderDonePlanProd(plan)));
    if (inProgress) {
      planProdElements.push(this.renderInProgressPlanProd(inProgress));
    }
    scheduled.forEach(plan => planProdElements.push(this.renderScheduledPlanProd(plan)));

    return planProdElements;
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
