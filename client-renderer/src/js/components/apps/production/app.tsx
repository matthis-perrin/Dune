import * as React from 'react';
import styled from 'styled-components';

import {PlanProdViewer} from '@root/components/apps/main/gestion/plan_prod_viewer';
import {StopList} from '@root/components/apps/production/stop_list';
import {SpeedChart} from '@root/components/charts/speed_chart';
import {ScheduleView} from '@root/components/common/schedule';
import {LoadingIndicator} from '@root/components/core/loading_indicator';
import {SCROLLBAR_WIDTH} from '@root/components/core/size_monitor';
import {SVGIcon} from '@root/components/core/svg_icon';
import {bridge} from '@root/lib/bridge';
import {
  getMinimumScheduleRangeForDate,
  getPlanProd,
  getCurrentPlanSchedule,
} from '@root/lib/schedule_utils';
import {capitalize, isSameDay} from '@root/lib/utils';
import {prodHoursStore, bobinesQuantitiesStore} from '@root/stores/data_store';
import {cadencierStore} from '@root/stores/list_store';
import {ProdInfoStore} from '@root/stores/prod_info_store';
import {ScheduleStore} from '@root/stores/schedule_store';
import {theme, Colors, Palette} from '@root/theme';

import {getWeekDay} from '@shared/lib/time';
import {ProdInfo, Schedule, ProdRange, StopType, BobineQuantities} from '@shared/models';

interface ProductionAppProps {
  initialDay: number;
}

interface ProductionAppState {
  day: number;
  schedule?: Schedule;
  cadencier?: Map<string, Map<number, number>>;
  bobineQuantities?: BobineQuantities[];
  prodInfo: ProdInfo;
  prodRanges?: Map<string, ProdRange>;
}

export class ProductionApp extends React.Component<ProductionAppProps, ProductionAppState> {
  public static displayName = 'ProductionApp';

  private readonly prodInfoStore: ProdInfoStore;
  private readonly scheduleStore: ScheduleStore;
  private openedStops = new Map<string, void>();

  public constructor(props: ProductionAppProps) {
    super(props);
    this.prodInfoStore = new ProdInfoStore(props.initialDay);
    const {start, end} = getMinimumScheduleRangeForDate(new Date(props.initialDay));
    this.scheduleStore = new ScheduleStore(start, end);
    this.state = {day: props.initialDay, prodInfo: this.prodInfoStore.getState()};
    document.title = this.getWindowTitle(props.initialDay);
  }

  public componentDidMount(): void {
    prodHoursStore.addListener(this.handleStoresChanged);
    cadencierStore.addListener(this.handleStoresChanged);
    bobinesQuantitiesStore.addListener(this.handleStoresChanged);
    this.prodInfoStore.addListener(this.handleProdInfoChanged);
    this.scheduleStore.start(this.handleScheduleChanged);
  }

  public componentWillUnmount(): void {
    prodHoursStore.removeListener(this.handleStoresChanged);
    cadencierStore.removeListener(this.handleStoresChanged);
    bobinesQuantitiesStore.removeListener(this.handleStoresChanged);
    this.prodInfoStore.addListener(this.handleProdInfoChanged);
    this.scheduleStore.stop();
  }

  private readonly handleStoresChanged = (): void => {
    this.setState({
      prodRanges: prodHoursStore.getProdRanges(),
      cadencier: cadencierStore.getCadencierIndex(),
      bobineQuantities: bobinesQuantitiesStore.getData(),
    });
  };

  private readonly handleProdInfoChanged = (): void => {
    const {day} = this.state;
    const prodInfo = this.prodInfoStore.getState();
    const {stops} = prodInfo;
    stops.forEach(s => {
      const hash = `${day}-${s.start}`;
      if (s.stopType === undefined && !this.openedStops.has(hash)) {
        this.openedStops.set(hash);
        bridge.openDayStopWindow(day, s.start).catch(console.error);
      }
    });
    this.setState({prodInfo});
  };

  private readonly handleScheduleChanged = (): void => {
    this.setState({schedule: this.scheduleStore.getSchedule()});
  };

  private changeDay(newDay: number): void {
    const {start, end} = getMinimumScheduleRangeForDate(new Date(newDay));
    this.prodInfoStore.setDay(newDay);
    this.scheduleStore.setRange(start, end);
    this.openedStops = new Map<string, void>();
    this.setState({day: newDay});
    document.title = this.getWindowTitle(newDay);
  }

  private readonly handlePreviousClick = (): void => {
    const {day} = this.state;
    const prodRanges = prodHoursStore.getProdRanges();
    if (!prodRanges) {
      return;
    }
    const newDay = new Date(day);
    newDay.setDate(newDay.getDate() - 1);
    while (prodRanges.get(getWeekDay(newDay)) === undefined) {
      newDay.setDate(newDay.getDate() - 1);
    }
    this.changeDay(newDay.getTime());
  };

  private readonly handleNextClick = (): void => {
    const {day} = this.state;
    const prodRanges = prodHoursStore.getProdRanges();
    if (!prodRanges) {
      return;
    }
    const newDay = new Date(day);
    newDay.setDate(newDay.getDate() + 1);
    while (prodRanges.get(getWeekDay(newDay)) === undefined) {
      newDay.setDate(newDay.getDate() + 1);
    }
    this.changeDay(newDay.getTime());
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
    const {stops} = this.state.prodInfo;
    const {schedule} = this.state;
    const lastMinute = schedule && schedule.lastMinuteSpeed && schedule.lastMinuteSpeed.minute;
    if (lastMinute === undefined) {
      return <React.Fragment />;
    }
    const orderedStops = stops
      .filter(s => s.stopType !== StopType.NotProdHours)
      .sort((s1, s2) => s1.start - s2.start);
    return <StopList lastMinute={lastMinute} stops={orderedStops} />;
  }

  private renderCurrentPlan(): JSX.Element {
    const {schedule, cadencier, bobineQuantities, day} = this.state;
    if (!schedule || !cadencier || !bobineQuantities) {
      return <LoadingIndicator size="large" />;
    }

    const currentPlanSchedule = getCurrentPlanSchedule(schedule);
    if (currentPlanSchedule) {
      if (isSameDay(new Date(day), new Date(currentPlanSchedule.start))) {
        const planProdSchedule = getPlanProd(schedule, currentPlanSchedule.planProd.id);
        if (planProdSchedule) {
          return (
            <PlanProdViewer
              bobineQuantities={bobineQuantities}
              cadencier={cadencier}
              schedule={planProdSchedule}
              width={planProdViewerWidth}
              hideOperationTable
              nonInteractive
            />
          );
        }
      }
    }

    return <div>Pas de plan de production en cours</div>;
  }

  private renderChart(): JSX.Element {
    const {day, prodInfo, prodRanges} = this.state;
    const prodRange = (prodRanges && prodRanges.get(getWeekDay(new Date(day)))) || {
      startHour: 0,
      startMinute: 0,
      endHour: 23,
      endMinute: 59,
    };
    return <SpeedChart day={day} prodRange={prodRange} speeds={prodInfo.minuteSpeeds} />;
  }

  public render(): JSX.Element {
    const {day, prodRanges, schedule} = this.state;

    return (
      <AppWrapper>
        <TopBar>
          <NavigationIcon onClick={this.handlePreviousClick}>
            <SVGIcon name="caret-left" width={iconSize} height={iconSize} />
          </NavigationIcon>
          <TopBarTitle>{this.formatDay(day)}</TopBarTitle>
          <NavigationIcon onClick={this.handleNextClick}>
            <SVGIcon name="caret-right" width={iconSize} height={iconSize} />
          </NavigationIcon>
        </TopBar>
        <ChartContainer>{this.renderChart()}</ChartContainer>
        <ProdStateContainer>
          <ScheduleContainer>
            <ScheduleView day={new Date(day)} prodRanges={prodRanges} schedule={schedule} />
          </ScheduleContainer>
          <EventsContainer>{this.renderStops()}</EventsContainer>
          <CurrentPlanContainer>{this.renderCurrentPlan()}</CurrentPlanContainer>
        </ProdStateContainer>
      </AppWrapper>
    );
  }
}

const iconSize = 16;
const planProdViewerWidth = 500;

const AppWrapper = styled.div`
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  background-color: ${theme.page.backgroundColor};
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

const ChartContainer = styled.div`
  flex-shrink: 0;
  height: 200px;
  background-color: ${Palette.White};
  box-sizing: border-box;
  padding: 16px 16px 0 0;
`;

const ProdStateContainer = styled.div`
  flex-grow: 1;
  display: flex;
`;

const ScheduleContainer = styled.div`
  flex-grow: 1;
  flex-basis: 1px;
  display: flex;
  overflow-y: auto;
`;

const EventsContainer = styled.div`
  flex-grow: 1;
  flex-basis: 1px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
`;

const CurrentPlanContainer = styled.div`
  flex-shrink: 0;
  width: ${planProdViewerWidth + SCROLLBAR_WIDTH}px;
  height: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
`;
