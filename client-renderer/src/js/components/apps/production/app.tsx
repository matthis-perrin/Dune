import * as React from 'react';
import styled from 'styled-components';

import {StopView} from '@root/components/apps/production/stop_view';
import {ScheduleView} from '@root/components/common/schedule';
import {SVGIcon} from '@root/components/core/svg_icon';
import {bridge} from '@root/lib/bridge';
import {getMinimumScheduleRangeForDate} from '@root/lib/schedule_utils';
import {capitalize} from '@root/lib/utils';
import {prodHoursStore} from '@root/stores/data_store';
import {ProdInfoStore} from '@root/stores/prod_info_store';
import {ScheduleStore} from '@root/stores/schedule_store';
import {theme, Colors} from '@root/theme';

import {getWeekDay} from '@shared/lib/time';
import {ProdInfo, Schedule, ProdRange, StopType} from '@shared/models';

interface ProductionAppProps {
  initialDay: number;
}

interface ProductionAppState {
  day: number;
  schedule?: Schedule;
  prodInfo: ProdInfo;
  prodRanges?: Map<string, ProdRange>;
}

export class ProductionApp extends React.Component<ProductionAppProps, ProductionAppState> {
  public static displayName = 'ProductionApp';

  private readonly prodInfoStore: ProdInfoStore;
  private readonly scheduleStore: ScheduleStore;
  private readonly openedStops = new Map<string, void>();

  public constructor(props: ProductionAppProps) {
    super(props);
    this.prodInfoStore = new ProdInfoStore(props.initialDay);
    const {start, end} = getMinimumScheduleRangeForDate(new Date(props.initialDay));
    this.scheduleStore = new ScheduleStore(start, end);
    this.state = {day: props.initialDay, prodInfo: this.prodInfoStore.getState()};
    document.title = this.formatDay(props.initialDay);
  }

  public componentDidMount(): void {
    prodHoursStore.addListener(this.handleStoresChanged);
    // stocksStore.addListener(this.handleStoresChanged);
    // cadencierStore.addListener(this.handleStoresChanged);
    // bobinesQuantitiesStore.addListener(this.handleStoresChanged);
    // operationsStore.addListener(this.recomputePlanOrder);
    this.prodInfoStore.addListener(this.handleProdInfoChanged);
    this.scheduleStore.start(this.handleScheduleChanged);
  }

  public componentWillUnmount(): void {
    prodHoursStore.removeListener(this.handleStoresChanged);
    //     stocksStore.removeListener(this.handleStoresChanged);
    //     cadencierStore.removeListener(this.handleStoresChanged);
    //     bobinesQuantitiesStore.removeListener(this.handleStoresChanged);
    //     operationsStore.removeListener(this.recomputePlanOrder);
    this.prodInfoStore.addListener(this.handleProdInfoChanged);
    this.scheduleStore.stop();
  }

  //   private readonly recomputePlanOrder = (newDay?: number): void => {
  //     const day = newDay === undefined ? this.state.day : newDay;
  //     const activePlansProd = plansProductionStore.getActivePlansProd();
  //     const operations = operationsStore.getData();
  //     if (activePlansProd && operations) {
  //       const orderedPlans = orderPlansProd(activePlansProd, operations, []);
  //       const orderedPlansForDay = getPlanProdsForDate(orderedPlans, new Date(day));
  //       this.setState({
  //         day,
  //         // TODO - Fetch non prod here
  //         orderedPlans: orderedPlansForDay,
  //         plansProd: activePlansProd,
  //         operations,
  //       });
  //     }
  //   };

  private readonly handleStoresChanged = (): void => {
    this.setState({
      prodRanges: prodHoursStore.getProdRanges(),
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
    this.setState({day: newDay});
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

  private formatDay(ts: number): string {
    const date = new Date(ts);
    const dayOfWeek = capitalize(getWeekDay(date));
    const day = date.getDate();
    const month = date.toLocaleString('fr-FR', {month: 'long'});
    const year = date.getFullYear();
    return `Production - ${dayOfWeek} ${day} ${month} ${year}`;
  }

  private renderStops(): Map<number, JSX.Element> {
    const stopsElements = new Map<number, JSX.Element>();
    const {stops} = this.state.prodInfo;
    stops
      .filter(s => s.stopType !== StopType.NotProdHours)
      .forEach(stop => stopsElements.set(stop.start, <StopView stop={stop} />));
    return stopsElements;
  }

  public render(): JSX.Element {
    const {day, prodRanges, schedule} = this.state;

    console.log(schedule);

    const stopsElements = this.renderStops();
    const histoStartTimes = Array.from(stopsElements.keys())
      .sort()
      .reverse();
    const histoElements = histoStartTimes.reduce(
      (elements, startTime) => {
        const stopElement = stopsElements.get(startTime);
        if (stopElement) {
          elements.push(stopElement);
        }
        return elements;
      },
      [] as JSX.Element[]
    );

    return (
      <AppWrapper>
        <TopBar>
          <div onClick={this.handlePreviousClick}>
            <SVGIcon name="caret-left" width={12} height={12} />
          </div>
          {this.formatDay(day)}
          <div onClick={this.handleNextClick}>
            <SVGIcon name="caret-right" width={12} height={12} />
          </div>
        </TopBar>
        <ChartContainer>Chart</ChartContainer>
        <ProdStateContainer>
          <ScheduleContainer>
            <ScheduleView day={new Date(day)} prodRanges={prodRanges} schedule={schedule} />
          </ScheduleContainer>
          <EventsContainer>{histoElements}</EventsContainer>
          <CurrentPlanContainer />
        </ProdStateContainer>
      </AppWrapper>
    );
  }
}

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
  align-items: center;
  justify-content: space-between;
  background-color: ${Colors.PrimaryDark};
  color: ${Colors.TextOnPrimary};
`;

const ChartContainer = styled.div`
  flex-shrink: 0;
  height: 256px;
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
`;

const CurrentPlanContainer = styled.div`
  flex-grow: 1;
  flex-basis: 1px;
  display: flex;
  flex-direction: column;
`;
