import * as React from 'react';
import styled from 'styled-components';

import {WithColor} from '@root/components/core/with_colors';
import {bridge} from '@root/lib/bridge';
import {contextMenuManager} from '@root/lib/context_menu';
import {showDayContextMenu} from '@root/lib/day_context_menu';
import {getPlanProdTitle, getShortPlanProdTitle} from '@root/lib/plan_prod';
import {showPlanContextMenu} from '@root/lib/plan_prod_context_menu';
import {
  getScheduleStart,
  getScheduleEnd,
  getPlanStatus,
  getPlanProd,
} from '@root/lib/schedule_utils';
import {getColorForStopType, getLabelForStopType} from '@root/lib/stop';
import {isRoundHour, isHalfHour, isSameDay, numberWithSeparator} from '@root/lib/utils';
import {theme, Palette, FontWeight, alpha} from '@root/theme';

import {dateAtHour} from '@shared/lib/time';
import {padNumber} from '@shared/lib/utils';
import {
  Stock,
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
  withContextMenu?: boolean;
  onPlanProdRefreshNeeded(): void;
}

const PLANNED_EVENT_OPACITY = 0.75;
const NON_PROD_OPACITY = 0.5;
const HALF_HOUR_MS = 1800000;
const TIME_PADDING = HALF_HOUR_MS;

export class ScheduleView extends React.Component<ScheduleViewProps> {
  public static displayName = 'ScheduleView';

  private scheduleRange: {start: number; end: number};
  private readonly scheduleWrapperRef = React.createRef<HTMLDivElement>();

  constructor(props: ScheduleViewProps) {
    super(props);
    this.scheduleRange = this.getScheduleRange();
  }

  public componentDidUpdate(prevProps: ScheduleViewProps): void {
    if (this.props.day !== prevProps.day) {
      const scheduleWrapper = this.scheduleWrapperRef.current;
      if (scheduleWrapper) {
        scheduleWrapper.scrollTo(0, 0);
      }
    }
  }

  private getProdHours(): {start: number; end: number} {
    const defaultStartHour = 1;
    const defaultEndHour = 23;
    const {day, schedule} = this.props;
    if (!schedule) {
      return {
        start: dateAtHour(day, defaultStartHour).getTime(),
        end: dateAtHour(day, defaultEndHour).getTime(),
      };
    }
    const dayOfWeek = day.toLocaleString('fr-FR', {weekday: 'long'});
    const prodHours = schedule.prodHours.get(dayOfWeek);
    if (!prodHours) {
      return {
        start: dateAtHour(day, defaultStartHour).getTime(),
        end: dateAtHour(day, defaultEndHour).getTime(),
      };
    }
    return {
      start: dateAtHour(day, prodHours.startHour, prodHours.startMinute).getTime(),
      end: dateAtHour(day, prodHours.endHour, prodHours.endMinute).getTime(),
    };
  }

  private getScheduleRange(): {start: number; end: number} {
    const {start, end} = this.getProdHours();
    return {
      start: start - TIME_PADDING,
      end: end + TIME_PADDING,
    };
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
      current += HALF_HOUR_MS;
    }

    return (
      <HoursSVG
        onContextMenu={this.handleContextMenuForDay}
        style={{position: 'absolute'}}
        height={height}
        width="100%"
      >
        {svgComponents}
      </HoursSVG>
    );
  }

  private adjustDates(start: Date, end: Date): {startTime: number; endTime: number} {
    const startTime = Math.max(this.scheduleRange.start, start.getTime());
    const endTime = Math.min(this.scheduleRange.end, end.getTime());
    return {startTime, endTime};
  }

  private getPositionStyleForDates(
    start: Date,
    end: Date,
    borderSize: number = 0
  ): React.CSSProperties {
    const {startTime, endTime} = this.adjustDates(start, end);
    const left = paddingLeft + sideBlockWidth;
    const width = `calc(100% - ${left + paddingRight}px)`;
    const top = this.getYPosForTime(startTime);
    const bottom = this.getYPosForTime(endTime);
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
    const {startTime, endTime} = this.adjustDates(start, end);
    const top = this.getYPosForTime(startTime);
    const bottom = this.getYPosForTime(endTime);
    const height = bottom - top;
    // tslint:disable:no-magic-numbers
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
    // tslint:enable:no-magic-numbers
  }

  private getTitleForHeight(schedule: PlanProdSchedule, height: number): JSX.Element {
    const id = schedule.planProd.id;
    const showMetrage = schedule.status !== PlanProductionStatus.PLANNED;
    let title = <React.Fragment />;
    const metrage = (
      <PlanTitleMetrage>{`${numberWithSeparator(
        Math.round(schedule.doneProdMeters)
      )} m`}</PlanTitleMetrage>
    );
    // tslint:disable:no-magic-numbers
    if (height >= 180) {
      title = <PlanTitleId>{getPlanProdTitle(id)}</PlanTitleId>;
    } else if (height >= 50) {
      title = <PlanTitleId>{getShortPlanProdTitle(id)}</PlanTitleId>;
    }
    // tslint:enable:no-magic-numbers
    return (
      <React.Fragment>
        {title}
        {showMetrage ? metrage : <React.Fragment />}
      </React.Fragment>
    );
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
    if (duration < 60 * 1000) {
      const seconds = Math.round(duration / 1000);
      return (
        <React.Fragment>
          <TimeValue>{seconds}</TimeValue>
          <TimeLabel> s</TimeLabel>
        </React.Fragment>
      );
    }
    const minutes = Math.round(duration / (60 * 1000));
    return (
      <React.Fragment>
        <TimeValue>{minutes}</TimeValue>
        <TimeLabel> min</TimeLabel>
      </React.Fragment>
    );
  }

  private renderDurationLabel(duration: number, height: number): JSX.Element {
    // tslint:disable:no-magic-numbers
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
    // tslint:enable:no-magic-numbers
    const hours = Math.floor(duration / (60 * 60 * 1000));
    const minutes = Math.round((duration - hours * 60 * 60 * 1000) / (60 * 1000));
    const minutesStr = padNumber(minutes, 2);

    if (hours === 0) {
      return <VerticalDuration>{this.renderMinuteDuration(duration)}</VerticalDuration>;
    }

    return <VerticalDuration>{`${hours}h${minutesStr}`}</VerticalDuration>;
  }

  private readonly handleContextMenuForPlan = (planId: number) => (
    event: React.MouseEvent
  ): void => {
    console.log('handleContextMenuForPlan');
    event.preventDefault();
    event.stopPropagation();
    const {schedule, withContextMenu, onPlanProdRefreshNeeded} = this.props;
    if (!schedule || !withContextMenu) {
      return;
    }
    const planSchedule = getPlanProd(schedule, planId);
    if (!planSchedule) {
      return;
    }
    const planType = getPlanStatus(planSchedule);
    if (planType === PlanProductionStatus.PLANNED) {
      showPlanContextMenu(schedule, planSchedule.planProd.id, onPlanProdRefreshNeeded);
    }
  };

  private readonly handleContextMenuForNonProd = (end: number | undefined) => (
    event: React.MouseEvent
  ): void => {
    console.log('handleContextMenuForNonProd');
    const {schedule, onPlanProdRefreshNeeded} = this.props;
    if (!schedule || end === undefined) {
      return;
    }
    const nonProd = schedule.nonProds.find(np => np.end === end);
    const currentTime =
      schedule.lastSpeedTime !== undefined ? schedule.lastSpeedTime.time : Date.now();
    if (nonProd && nonProd.start > currentTime) {
      event.preventDefault();
      event.stopPropagation();
      contextMenuManager.open([
        {
          label: 'Supprimer cette zone de non production',
          callback: () =>
            bridge
              .deleteNonProd(nonProd.id)
              .then(onPlanProdRefreshNeeded)
              .catch(console.error),
        },
      ]);
    }
  };

  private readonly handleContextMenuForMaintenance = (maintenanceId: number) => (
    event: React.MouseEvent
  ): void => {
    console.log('handleContextMenuForMaintenance');
    const {onPlanProdRefreshNeeded} = this.props;
    event.preventDefault();
    event.stopPropagation();
    contextMenuManager.open([
      {
        label: 'Supprimer cette maintenance',
        callback: () =>
          bridge
            .deleteMaintenance(maintenanceId)
            .then(onPlanProdRefreshNeeded)
            .catch(console.error),
      },
    ]);
  };

  private readonly handleContextMenuForDay = (event: React.MouseEvent): void => {
    const {schedule, day, onPlanProdRefreshNeeded} = this.props;
    console.log('handleContextMenuForDay');
    if (event.type === 'contextmenu' && schedule !== undefined) {
      showDayContextMenu(schedule, day, onPlanProdRefreshNeeded);
    }
  };

  private renderStop(stop: Stop, planId: number, color: Color, isPlanned: boolean): JSX.Element {
    if (stop.stopType === StopType.NotProdHours) {
      return <React.Fragment />;
    }
    if (!stop.end) {
      console.log(stop);
      throw new Error('invalid stop');
    }

    let defaultLabel = stop.title;
    let contextMenuHandler = this.handleContextMenuForPlan(planId);
    if (stop.maintenanceId !== undefined) {
      const {schedule} = this.props;
      if (schedule) {
        const maintenance = schedule.maintenances.find(m => m.id === stop.maintenanceId);
        if (maintenance) {
          defaultLabel = maintenance.title;
        }
        const currentTime =
          schedule.lastSpeedTime !== undefined ? schedule.lastSpeedTime.time : Date.now();
        if (stop.start > currentTime) {
          contextMenuHandler = this.handleContextMenuForMaintenance(stop.maintenanceId);
        }
      }
    }

    const stopLabel = getLabelForStopType(stop.stopType, defaultLabel);
    const positionStyles = this.getPositionStyleForDates(new Date(stop.start), new Date(stop.end));
    const durationLabel = this.renderDurationLabel(
      stop.end - stop.start,
      positionStyles.height as number
    );
    const labelTextStyles = this.getTextStyleForDates(new Date(stop.start), new Date(stop.end));
    return (
      <React.Fragment>
        <StopWrapper
          onContextMenu={contextMenuHandler}
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
          onContextMenu={contextMenuHandler}
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

  private renderNonProd(stop: Stop): JSX.Element {
    if (!stop.end) {
      console.log(stop);
      throw new Error('invalid stop');
    }
    const stopLabel = getLabelForStopType(stop.stopType, stop.title);
    const positionStyles = this.getPositionStyleForDates(new Date(stop.start), new Date(stop.end));

    const labelTextStyles = this.getTextStyleForDates(new Date(stop.start), new Date(stop.end));
    return (
      <StopWrapper
        onContextMenu={this.handleContextMenuForNonProd(stop.end)}
        style={{
          ...positionStyles,
          left: 0,
          width: '100%',
          background: alpha(Palette.Asbestos, NON_PROD_OPACITY),
        }}
      >
        <StopLabel style={labelTextStyles}>{stopLabel}</StopLabel>
      </StopWrapper>
    );
  }

  private renderNonProds(stops: Stop[]): JSX.Element[] {
    // We merge adjacent non prods so it looks better in the UI
    let current: Stop | undefined;
    const mergedStops: Stop[] = [];
    stops
      .sort((s1, s2) => s1.start - s2.start)
      .forEach(s => {
        if (current === undefined) {
          current = s;
          return;
        }
        if (current.end === s.start && current.title === s.title) {
          current = {...current, end: s.end};
          return;
        }
        mergedStops.push(current);
        current = s;
      });
    if (current !== undefined) {
      mergedStops.push(current);
    }

    return mergedStops.map(s => this.renderNonProd(s));
  }

  private renderProd(prod: Prod, planId: number, color: Color, isPlanned: boolean): JSX.Element {
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
          onContextMenu={this.handleContextMenuForPlan(planId)}
          style={{
            ...positionStyles,
            backgroundColor: color.backgroundHex,
            color: color.textHex,
            opacity: isPlanned ? PLANNED_EVENT_OPACITY : 1,
          }}
        />
        <DurationWrapper
          onContextMenu={this.handleContextMenuForPlan(planId)}
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
    const {start, end} = this.getProdHours();
    const scheduleStart = getScheduleStart(planSchedule);
    const scheduleEnd = getScheduleEnd(planSchedule);

    if (scheduleStart === undefined || scheduleEnd === undefined) {
      return (
        <React.Fragment>
          {this.renderNonProds(
            planSchedule.stops
              .concat(planSchedule.plannedStops)
              .filter(s => s.stopType === StopType.NotProdHours)
          )}
        </React.Fragment>
      );
    }

    const planId = planSchedule.planProd.id;
    const planBorderPosition = this.getPositionStyleForDates(
      new Date(Math.max(start, scheduleStart)),
      new Date(Math.min(end, scheduleEnd)),
      planBorderThickness
    );
    return (
      <WithColor color={planSchedule.planProd.data.papier.couleurPapier}>
        {color => (
          <React.Fragment>
            {([] as JSX.Element[])
              .concat(planSchedule.stops.map(s => this.renderStop(s, planId, color, false)))
              .concat(planSchedule.plannedStops.map(s => this.renderStop(s, planId, color, true)))
              .concat(planSchedule.prods.map(p => this.renderProd(p, planId, color, false)))
              .concat(planSchedule.plannedProds.map(p => this.renderProd(p, planId, color, true)))}
            <PlanProdBorder
              style={{
                ...planBorderPosition,
                width: `calc(100% - ${paddingLeft + paddingRight}px - ${planBorderThickness}px)`,
              }}
            />
            <PlanTitle
              onContextMenu={this.handleContextMenuForPlan(planId)}
              style={{
                ...planBorderPosition,
                width: sideBlockWidth,
                left: paddingLeft,
                background: color.backgroundHex,
              }}
            >
              {this.getTitleForHeight(planSchedule, planBorderPosition.height as number)}
            </PlanTitle>
            {this.renderNonProds(
              planSchedule.stops
                .concat(planSchedule.plannedStops)
                .filter(s => s.stopType === StopType.NotProdHours)
            )}
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
    const {start, end} = this.getProdHours();
    if (schedule) {
      const {lastSpeedTime} = schedule;
      if (
        lastSpeedTime &&
        isSameDay(new Date(day), new Date(lastSpeedTime.time)) &&
        lastSpeedTime.time >= start &&
        lastSpeedTime.time <= end
      ) {
        const left = paddingLeft;
        const right = paddingRight;
        const width = `calc(100% - ${left + right - sideBlockWidth}px)`;
        const top = this.getYPosForTime(lastSpeedTime.time);
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
      <ScheduleWrapper ref={this.scheduleWrapperRef}>
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

const TimeValue = styled.div``;
const TimeLabel = styled.div`
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
  pointer-events: none;
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
