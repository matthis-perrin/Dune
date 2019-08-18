import * as React from 'react';
import styled from 'styled-components';

import {StopList} from '@root/components/apps/production/stop_list';
import {SpeedChart, SpeedChartEvent} from '@root/components/charts/speed_chart';
import {DayProductionTable} from '@root/components/common/day_production_table';
import {DayStats} from '@root/components/common/day_stats';
import {PlanProdViewer} from '@root/components/common/plan_prod_viewer';
import {ScheduleView} from '@root/components/common/schedule';
import {LoadingIndicator} from '@root/components/core/loading_indicator';
import {SCROLLBAR_WIDTH} from '@root/components/core/size_monitor';
import {SVGIcon} from '@root/components/core/svg_icon';
import {bridge} from '@root/lib/bridge';
import {getPlanProd, getCurrentPlanSchedule, getScheduleEnd} from '@root/lib/schedule_utils';
import {
  MORNING_TEAM_FILTER,
  AFTERNOON_TEAM_FILTER,
  ALL_TEAM_FILTER,
} from '@root/lib/statistics/metrics';
import {getColorForStopType} from '@root/lib/stop';
import {isSameDay} from '@root/lib/utils';
import {bobinesQuantitiesStore} from '@root/stores/data_store';
import {cadencierStore, stocksStore} from '@root/stores/list_store';
import {ProdInfoStore} from '@root/stores/prod_info_store';
import {ScheduleStore} from '@root/stores/schedule_store';
import {Colors, Palette} from '@root/theme';

import {getWeekDay} from '@shared/lib/time';
import {startOfDay, endOfDay, capitalize} from '@shared/lib/utils';
import {ProdInfo, Schedule, StopType, BobineQuantities, Stock} from '@shared/models';

interface ProductionAppProps {
  initialDay?: number;
}

interface ProductionAppState {
  day?: Date;
  schedule?: Schedule;
  cadencier?: Map<string, Map<number, number>>;
  bobineQuantities?: BobineQuantities[];
  stocks?: Map<string, Stock[]>;
  prodInfo?: ProdInfo;
}

export class ProductionApp extends React.Component<ProductionAppProps, ProductionAppState> {
  public static displayName = 'ProductionApp';

  private readonly scheduleStore: ScheduleStore;
  private prodInfoStore: ProdInfoStore | undefined;
  private openedStops = new Map<string, void>();

  public constructor(props: ProductionAppProps) {
    super(props);
    let range: {start: number; end: number} | undefined;
    if (props.initialDay) {
      const date = new Date(props.initialDay);
      range = {start: startOfDay(date).getTime(), end: endOfDay(date).getTime()};
      this.state = {day: date};
    } else {
      this.state = {};
    }
    this.scheduleStore = new ScheduleStore(range);
  }

  public componentDidMount(): void {
    cadencierStore.addListener(this.handleStoresChanged);
    bobinesQuantitiesStore.addListener(this.handleStoresChanged);
    stocksStore.addListener(this.handleStoresChanged);
    this.scheduleStore.start(this.handleScheduleChanged);
  }

  public componentWillUnmount(): void {
    cadencierStore.removeListener(this.handleStoresChanged);
    bobinesQuantitiesStore.removeListener(this.handleStoresChanged);
    stocksStore.removeListener(this.handleStoresChanged);
    if (this.prodInfoStore) {
      this.prodInfoStore.removeListener(this.handleProdInfoChanged);
    }
    this.scheduleStore.stop();
  }

  private readonly handleStoresChanged = (): void => {
    this.setState({
      cadencier: cadencierStore.getCadencierIndex(),
      bobineQuantities: bobinesQuantitiesStore.getData(),
      stocks: stocksStore.getStockIndex(),
    });
  };

  private readonly handleScheduleChanged = (): void => {
    const schedule = this.scheduleStore.getSchedule();
    this.setState({schedule});
    if (!schedule) {
      return;
    }
    const currentDay = this.getCurrentDay();
    if (currentDay) {
      const dayTs = currentDay.getTime();
      if (!this.prodInfoStore) {
        this.prodInfoStore = new ProdInfoStore(dayTs);
        this.prodInfoStore.addListener(this.handleProdInfoChanged);
      }
      const stops = schedule.stops.filter(s => isSameDay(new Date(s.start), currentDay));
      stops.forEach(s => {
        const hash = `${dayTs}-${s.start}`;
        if (s.stopType === undefined && !this.openedStops.has(hash)) {
          this.openedStops.set(hash);
          bridge.openDayStopWindow(dayTs, s.start).catch(console.error);
        }
      });
    }
  };

  private readonly handleProdInfoChanged = (): void => {
    if (this.prodInfoStore) {
      const prodInfo = this.prodInfoStore.getState();
      this.setState({prodInfo});
    }
  };

  private changeDay(newDay: number): void {
    const newDayDate = new Date(newDay);
    const start = startOfDay(newDayDate).getTime();
    const end = endOfDay(newDayDate).getTime();
    this.scheduleStore.setRange({start, end});
    if (this.prodInfoStore) {
      this.prodInfoStore.setDay(start);
    }
    this.setState({day: newDayDate});
    this.openedStops = new Map<string, void>();
    document.title = this.getWindowTitle(newDay);
  }

  private getCurrentDay(): Date | undefined {
    const {schedule, day} = this.state;
    if (day) {
      return day;
    }
    if (!schedule) {
      const {initialDay} = this.props;
      return initialDay !== undefined ? startOfDay(new Date(initialDay)) : undefined;
    }
    return schedule.lastSpeedTime === undefined
      ? new Date()
      : startOfDay(new Date(schedule.lastSpeedTime.time));
  }

  private readonly handlePreviousClick = (): void => {
    const {schedule} = this.state;
    const currentDay = this.getCurrentDay();
    if (!schedule || !currentDay) {
      return;
    }
    const prodHours = schedule.prodHours;
    currentDay.setDate(currentDay.getDate() - 1);
    while (prodHours.get(getWeekDay(currentDay)) === undefined) {
      currentDay.setDate(currentDay.getDate() - 1);
    }
    this.changeDay(currentDay.getTime());
  };

  private readonly handleNextClick = (): void => {
    const {schedule} = this.state;
    const currentDay = this.getCurrentDay();
    if (!schedule || !currentDay) {
      return;
    }
    const prodHours = schedule.prodHours;
    currentDay.setDate(currentDay.getDate() + 1);
    while (prodHours.get(getWeekDay(currentDay)) === undefined) {
      currentDay.setDate(currentDay.getDate() + 1);
    }
    this.changeDay(currentDay.getTime());
  };

  private getWindowTitle(ts: number): string {
    return `Production - ${this.formatDay(ts)}`;
  }

  private formatDay(ts: number): string {
    const date = new Date(ts);
    const dayOfWeek = capitalize(getWeekDay(date));
    const day = date.getDate();
    const month = date.toLocaleString('fr-FR', {month: 'long'});
    const year = date.getFullYear();
    return `${dayOfWeek} ${day} ${month} ${year}`;
  }

  private renderStops(): JSX.Element {
    const {schedule} = this.state;
    const currentDay = this.getCurrentDay();
    const lastMinute =
      (schedule && schedule.lastSpeedTime && schedule.lastSpeedTime.time) || Date.now();
    if (schedule === undefined || currentDay === undefined) {
      return <LoadingIndicator size="large" />;
    }

    const stops = schedule.stops
      .filter(s => s.stopType !== StopType.NotProdHours)
      .filter(s => isSameDay(new Date(s.start), currentDay))
      .sort((s1, s2) => s1.start - s2.start);

    return <StopList schedule={schedule} lastMinute={lastMinute} stops={stops} />;
  }

  private getDayStatus(): 'past' | 'current' | 'future' | 'unknown' {
    const {schedule} = this.state;
    const currentDay = this.getCurrentDay();
    if (!schedule || currentDay === undefined) {
      return 'unknown';
    }
    const prodTime =
      schedule.lastSpeedTime === undefined ? Date.now() : schedule.lastSpeedTime.time;
    const currentDayStart = startOfDay(currentDay).getTime();
    const currentDayEnd = endOfDay(currentDay).getTime();

    if (prodTime < currentDayStart) {
      return 'future';
    }
    if (prodTime >= currentDayEnd) {
      return 'past';
    }
    return 'current';
  }

  private renderCurrentPlan(): JSX.Element {
    const {schedule, cadencier, bobineQuantities, stocks} = this.state;
    const currentDay = this.getCurrentDay();
    if (!schedule || !cadencier || !bobineQuantities || !stocks || currentDay === undefined) {
      return <LoadingIndicator size="large" />;
    }

    const dayStatus = this.getDayStatus();
    if (dayStatus === 'unknown') {
      return <LoadingIndicator size="large" />;
    }

    if (dayStatus === 'past') {
      return (
        <React.Fragment>
          <BlockTitle>PRODUCTION RÉALISÉE (THÉORIQUE)</BlockTitle>
          <DayProductionTable
            day={currentDay.getTime()}
            stocks={stocks}
            schedule={schedule}
            width={planProdViewerWidth}
          />
        </React.Fragment>
      );
    }
    if (dayStatus === 'future') {
      return (
        <React.Fragment>
          <BlockTitle>PRODUCTION PLANNIFIÉE</BlockTitle>
          <DayProductionTable
            day={currentDay.getTime()}
            stocks={stocks}
            schedule={schedule}
            width={planProdViewerWidth}
          />
        </React.Fragment>
      );
    }

    const currentPlanSchedule = getCurrentPlanSchedule(schedule);
    if (currentPlanSchedule) {
      const planEnd = getScheduleEnd(currentPlanSchedule);
      if (planEnd !== undefined && isSameDay(new Date(currentDay), new Date(planEnd))) {
        const planProdSchedule = getPlanProd(schedule, currentPlanSchedule.planProd.id);
        if (planProdSchedule) {
          return (
            <React.Fragment>
              <BlockTitle>PRODUCTION EN COURS</BlockTitle>
              <PlanProdViewer
                bobineQuantities={bobineQuantities}
                cadencier={cadencier}
                schedule={planProdSchedule}
                width={planProdViewerWidth}
                hideOperationTable
                nonInteractive
              />
            </React.Fragment>
          );
        }
      }
    }

    return (
      <React.Fragment>
        <BlockTitle>PRODUCTION EN COURS</BlockTitle>
        <div style={{color: Palette.White}}>Pas de plan de production en cours</div>
      </React.Fragment>
    );
  }

  private renderChart(): JSX.Element {
    const {schedule, prodInfo} = this.state;
    const currentDay = this.getCurrentDay();

    if (!schedule || !prodInfo || currentDay === undefined) {
      return <LoadingIndicator size="large" />;
    }

    const prodRanges = schedule.prodHours;
    const prodRange = prodRanges.get(getWeekDay(currentDay)) || {
      startHour: 0,
      startMinute: 0,
      endHour: 23,
      endMinute: 59,
    };

    const events: SpeedChartEvent[] = [];
    schedule.plans.forEach(p =>
      p.schedulePerDay.forEach(s =>
        s.stops.forEach(stop => {
          const eventEnd =
            stop.end !== undefined
              ? stop.end
              : schedule.lastSpeedTime !== undefined
              ? schedule.lastSpeedTime.time
              : undefined;
          if (eventEnd !== undefined) {
            events.push({
              start: stop.start,
              end: eventEnd,
              color: getColorForStopType(stop.stopType),
            });
          }
        })
      )
    );

    return (
      <SpeedChart
        day={currentDay.getTime()}
        lastTimeSpeed={schedule.lastSpeedTime}
        prodRange={prodRange}
        speeds={prodInfo.speedTimes}
        events={events}
      />
    );
  }

  private renderPlanning(): JSX.Element {
    const {schedule} = this.state;
    const currentDay = this.getCurrentDay();
    if (!schedule || currentDay === undefined) {
      return <LoadingIndicator size="large" />;
    }

    return (
      <ScheduleView
        day={currentDay}
        schedule={schedule}
        onPlanProdRefreshNeeded={() => this.scheduleStore.refresh()}
        style={{overflowY: 'auto'}}
      />
    );
  }

  private renderTeamPerfs(): JSX.Element {
    const {schedule} = this.state;
    const currentDay = this.getCurrentDay();
    const dayStatus = this.getDayStatus();

    if (!schedule || currentDay === undefined) {
      return (
        <TeamPerfContainer>
          <LoadingIndicator size="large" />
        </TeamPerfContainer>
      );
    }
    if (dayStatus === 'unknown' || dayStatus === 'future') {
      return <React.Fragment />;
    }
    return (
      <TeamPerfContainer>
        {[MORNING_TEAM_FILTER, AFTERNOON_TEAM_FILTER, ALL_TEAM_FILTER].map(team => (
          <TeamPerfoBlock key={team.name}>
            <StatsTitle>{team.label}</StatsTitle>
            <DayStats
              day={currentDay.getTime()}
              operations={this.scheduleStore.getOperations()}
              schedule={schedule}
              team={team}
            />
          </TeamPerfoBlock>
        ))}
      </TeamPerfContainer>
    );
  }

  private renderTopBar(): JSX.Element {
    const currentDay = this.getCurrentDay();
    if (currentDay === undefined) {
      return <LoadingIndicator size="small" />;
    }
    return <span>{this.formatDay(currentDay.getTime())}</span>;
  }

  public render(): JSX.Element {
    return (
      <AppWrapper>
        <TopBar>
          <NavigationIcon onClick={this.handlePreviousClick}>
            <SVGIcon name="caret-left" width={iconSize} height={iconSize} />
          </NavigationIcon>
          <TopBarTitle>{this.renderTopBar()}</TopBarTitle>
          <NavigationIcon onClick={this.handleNextClick}>
            <SVGIcon name="caret-right" width={iconSize} height={iconSize} />
          </NavigationIcon>
        </TopBar>
        <ChartContainer>{this.renderChart()}</ChartContainer>
        {this.renderTeamPerfs()}
        <ProdStateContainer>
          <ScheduleContainer>
            <BlockTitle>PLANNING</BlockTitle>
            {this.renderPlanning()}
          </ScheduleContainer>
          <EventsContainer>
            <BlockTitle>ARRÊTS MACHINE</BlockTitle>
            {this.renderStops()}
          </EventsContainer>
          <CurrentPlanContainer>{this.renderCurrentPlan()}</CurrentPlanContainer>
        </ProdStateContainer>
      </AppWrapper>
    );
  }
}

const iconSize = 16;
const planProdViewerWidth = 500;
const blockMargin = 8;

const AppWrapper = styled.div`
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  background-color: ${Palette.Clouds};
`;

const TopBar = styled.div`
  flex-shrink: 0;
  height: 64px;
  display: flex;
  justify-content: space-between;
  background-color: ${Colors.PrimaryDark};
  color: ${Colors.TextOnPrimary};
`;

const TopBarTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
`;

const NavigationIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  width: 48px;
  &:hover svg {
    fill: ${Palette.White};
  }
  svg {
    fill: ${Palette.Clouds};
  }
`;

const Block = styled.div`
  position: relative;
  padding: 16px;
  padding-top: 64px;
  background-color: ${Colors.PrimaryDark};
`;

const BlockTitle = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 48px;
  background-color: ${Colors.SecondaryDark};
  color: ${Colors.TextOnSecondary};
  display: flex;
  font-size: 20px;
  align-items: center;
  justify-content: center;
`;

const StatsTitle = styled.div`
  height: 32px;
  background-color: ${Colors.SecondaryDark};
  color: ${Colors.TextOnSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
`;

const ChartContainer = styled(Block)`
  flex-shrink: 0;
  height: 200px;
  box-sizing: border-box;
  margin: ${blockMargin}px;
  padding: 16px 16px 0 0;
`;

const ProdStateContainer = styled.div`
  flex-grow: 1;
  display: flex;
  margin-bottom: ${blockMargin}px;
`;

const TeamPerfContainer = styled.div`
  flex-shrink: 0;
  display: flex;
  justify-content: space-evenly;
  margin: 0 ${blockMargin}px ${blockMargin}px ${blockMargin}px;
  padding: 16px;
  background-color: ${Colors.PrimaryDark};
`;

const TeamPerfoBlock = styled.div`
  width: 444px;
`;

const ScheduleContainer = styled(Block)`
  flex-grow: 1;
  flex-basis: 1px;
  display: flex;
  margin: 0 ${blockMargin}px;
`;

const EventsContainer = styled(Block)`
  flex-grow: 1;
  flex-basis: 1px;
  display: flex;
  flex-direction: column;
  margin-right: ${blockMargin}px;
`;

const CurrentPlanContainer = styled(Block)`
  flex-shrink: 0;
  width: ${planProdViewerWidth + SCROLLBAR_WIDTH}px;
  height: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  margin-right: ${blockMargin}px;
`;
