import * as React from 'react';
import styled from 'styled-components';

import {Schedule} from '@root/components/apps/view_day_app/schedule';
import {SVGIcon} from '@root/components/core/svg_icon';
import {PROD_HOURS_BY_DAY} from '@root/lib/constants';
import {PlansProdOrder, orderPlansProd, getPlanProdsForDate} from '@root/lib/plan_prod';
import {getDayOfWeek, getWeekDay} from '@root/lib/utils';
import {bobinesQuantitiesStore, operationsStore} from '@root/stores/data_store';
import {stocksStore, cadencierStore, plansProductionStore} from '@root/stores/list_store';
import {theme, Colors, Palette} from '@root/theme';

import {Stock, BobineQuantities, PlanProduction, Operation} from '@shared/models';

interface ViewDayAppProps {
  initialDay: number;
}

interface ViewDayAppState {
  day: number;
  stocks?: Map<string, Stock[]>;
  cadencier?: Map<string, Map<number, number>>;
  bobineQuantities?: BobineQuantities[];
  plansProd?: PlanProduction[];
  operations?: Operation[];
  orderedPlans?: PlansProdOrder;
}

export class ViewDayApp extends React.Component<ViewDayAppProps, ViewDayAppState> {
  public static displayName = 'ViewDayApp';

  public constructor(props: ViewDayAppProps) {
    super(props);
    this.state = {day: props.initialDay};
    document.title = this.formatDay(props.initialDay);
  }

  public componentDidMount(): void {
    stocksStore.addListener(this.handleStoresChanged);
    cadencierStore.addListener(this.handleStoresChanged);
    bobinesQuantitiesStore.addListener(this.handleStoresChanged);
    plansProductionStore.addListener(this.recomputePlanOrder);
    operationsStore.addListener(this.recomputePlanOrder);
  }

  public componentWillUnmount(): void {
    stocksStore.removeListener(this.handleStoresChanged);
    cadencierStore.removeListener(this.handleStoresChanged);
    bobinesQuantitiesStore.removeListener(this.handleStoresChanged);
    plansProductionStore.removeListener(this.recomputePlanOrder);
    operationsStore.removeListener(this.recomputePlanOrder);
  }

  private readonly recomputePlanOrder = (newDay?: number): void => {
    const day = newDay === undefined ? this.state.day : newDay;
    const activePlansProd = plansProductionStore.getActivePlansProd();
    const operations = operationsStore.getData();
    if (activePlansProd && operations) {
      const orderedPlans = orderPlansProd(activePlansProd, operations, []);
      const orderedPlansForDay = getPlanProdsForDate(orderedPlans, new Date(day));
      this.setState({
        day,
        // TODO - Fetch non prod here
        orderedPlans: orderedPlansForDay,
        plansProd: activePlansProd,
        operations,
      });
    }
  };

  private readonly handlePreviousClick = (): void => {
    const newDay = new Date(this.state.day);
    newDay.setDate(newDay.getDate() - 1);
    while (PROD_HOURS_BY_DAY.get(getWeekDay(newDay)) === undefined) {
      newDay.setDate(newDay.getDate() - 1);
    }
    this.recomputePlanOrder(newDay.getTime());
  };

  private readonly handleNextClick = (): void => {
    const newDay = new Date(this.state.day);
    newDay.setDate(newDay.getDate() + 1);
    while (PROD_HOURS_BY_DAY.get(getWeekDay(newDay)) === undefined) {
      newDay.setDate(newDay.getDate() + 1);
    }
    this.recomputePlanOrder(newDay.getTime());
  };

  private readonly handleStoresChanged = (): void => {
    this.setState({
      stocks: stocksStore.getStockIndex(),
      cadencier: cadencierStore.getCadencierIndex(),
      bobineQuantities: bobinesQuantitiesStore.getData(),
    });
  };

  private formatDay(ts: number): string {
    const date = new Date(ts);
    const day = date.getDate();
    const month = date.toLocaleString('fr-FR', {month: 'long'});
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }

  public render(): JSX.Element {
    const {
      bobineQuantities,
      cadencier,
      operations,
      plansProd,
      day,
      orderedPlans,
      stocks,
    } = this.state;

    return (
      <AppWrapper>
        <LeftColumn>
          <TopBar>
            <div onClick={this.handlePreviousClick}>
              <SVGIcon name="caret-left" width={12} height={12} />
            </div>
            {this.formatDay(this.state.day)}
            <div onClick={this.handleNextClick}>
              <SVGIcon name="caret-right" width={12} height={12} />
            </div>
          </TopBar>
          <ScheduleWrapper>
            <Schedule
              bobineQuantities={bobineQuantities}
              cadencier={cadencier}
              operations={operations}
              plansProd={plansProd}
              day={new Date(day)}
              orderedPlans={orderedPlans}
              stocks={stocks}
            />
          </ScheduleWrapper>
        </LeftColumn>
        <RightColumn>
          <div>Stats</div>
          <div>Prod</div>
          <div>Chart</div>
        </RightColumn>
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
  width: 980px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
`;

const TopBar = styled.div`
  flex-shrink: 0;
  background-color: ${Colors.PrimaryDark};
  color: ${Colors.TextOnPrimary};
  height: 64px;
`;

const ScheduleWrapper = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  background-color: ${Palette.Clouds};
`;

const RightColumn = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  background-color: ${Colors.PrimaryLight};
`;
