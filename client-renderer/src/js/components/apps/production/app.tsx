import * as React from 'react';
import styled from 'styled-components';

import {StopView} from '@root/components/apps/production/stop_view';
import {SVGIcon} from '@root/components/core/svg_icon';
import {bridge} from '@root/lib/bridge';
import {PROD_HOURS_BY_DAY} from '@root/lib/constants';
import {getWeekDay, capitalize} from '@root/lib/utils';
import {ProdInfoStore} from '@root/stores/prod_info_store';
import {theme, Colors} from '@root/theme';

import {ProdInfo, Stop} from '@shared/models';

interface ProductionAppProps {
  initialDay: number;
}

interface ProductionAppState {
  day: number;
  prodInfo: ProdInfo;
}

export class ProductionApp extends React.Component<ProductionAppProps, ProductionAppState> {
  public static displayName = 'ProductionApp';

  private readonly prodInfoStore: ProdInfoStore;
  private readonly openedStops = new Map<string, void>();

  public constructor(props: ProductionAppProps) {
    super(props);
    this.prodInfoStore = new ProdInfoStore(props.initialDay);
    this.state = {day: props.initialDay, prodInfo: this.prodInfoStore.getState()};
    document.title = this.formatDay(props.initialDay);
  }

  public componentDidMount(): void {
    // stocksStore.addListener(this.handleStoresChanged);
    // cadencierStore.addListener(this.handleStoresChanged);
    // bobinesQuantitiesStore.addListener(this.handleStoresChanged);
    // plansProductionStore.addListener(this.recomputePlanOrder);
    // operationsStore.addListener(this.recomputePlanOrder);
    this.prodInfoStore.addListener(this.handleProdInfoChanged);
  }

  public componentWillUnmount(): void {
    //     stocksStore.removeListener(this.handleStoresChanged);
    //     cadencierStore.removeListener(this.handleStoresChanged);
    //     bobinesQuantitiesStore.removeListener(this.handleStoresChanged);
    //     plansProductionStore.removeListener(this.recomputePlanOrder);
    //     operationsStore.removeListener(this.recomputePlanOrder);
    this.prodInfoStore.addListener(this.handleProdInfoChanged);
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

  //   private readonly handleStoresChanged = (): void => {
  //     this.setState({
  //       stocks: stocksStore.getStockIndex(),
  //       cadencier: cadencierStore.getCadencierIndex(),
  //       bobineQuantities: bobinesQuantitiesStore.getData(),
  //     });
  //   };

  private readonly handleProdInfoChanged = (): void => {
    const {day} = this.state;
    const prodInfo = this.prodInfoStore.getState();
    const {stops} = prodInfo;
    stops.forEach(s => {
      const hash = `${day}-${s.start}`;
      if (s.stopType === undefined && !this.openedStops.has(hash)) {
        this.openedStops.set(hash);
        bridge.openDayStopWindow(day, s.start);
      }
    });
    this.setState({prodInfo});
  };

  private changeDay(newDay: number): void {
    this.prodInfoStore.setDay(newDay);
    this.setState({day: newDay});
  }

  private readonly handlePreviousClick = (): void => {
    const newDay = new Date(this.state.day);
    newDay.setDate(newDay.getDate() - 1);
    while (PROD_HOURS_BY_DAY.get(getWeekDay(newDay)) === undefined) {
      newDay.setDate(newDay.getDate() - 1);
    }
    this.changeDay(newDay.getTime());
  };

  private readonly handleNextClick = (): void => {
    const newDay = new Date(this.state.day);
    newDay.setDate(newDay.getDate() + 1);
    while (PROD_HOURS_BY_DAY.get(getWeekDay(newDay)) === undefined) {
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
    const {stops} = this.state.prodInfo;
    const stopsElements = new Map<number, JSX.Element>();
    stops.forEach(stop => stopsElements.set(stop.start, <StopView stop={stop} />));
    return stopsElements;
  }

  public render(): JSX.Element {
    const {day} = this.state;

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
        <LeftColumn>
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
          <InfosContainer>
            <HistoContainer>{histoElements}</HistoContainer>
            <StatsContainer>Stats</StatsContainer>
          </InfosContainer>
        </LeftColumn>
        <RightColumn>Plans de productions</RightColumn>
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
  background-color: ${theme.page.backgroundColor};
`;

const LeftColumn = styled.div`
  flex-grow: 1;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
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
  flex-grow: 1;
  flex-basis: 1px;
`;

const InfosContainer = styled.div`
  flex-grow: 1;
  flex-basis: 1px;
  display: flex;
`;

const HistoContainer = styled.div`
  flex-grow: 1;
  flex-basis: 1px;
  display: flex;
  flex-direction: column;
`;

const StatsContainer = styled.div`
  flex-grow: 1;
  flex-basis: 1px;
  display: flex;
  flex-direction: column;
`;

const RightColumn = styled.div`
  width: 384px;
  display: flex;
  flex-direction: column;
  background-color: ${Colors.PrimaryLight};
`;
