import {find} from 'lodash-es';
import * as React from 'react';
import Popup from 'reactjs-popup';
import styled from 'styled-components';

import {PlansProdOrder, orderPlansProd} from '@root/lib/plan_prod';
import {bobinesQuantitiesStore, operationsStore} from '@root/stores/data_store';
import {stocksStore, cadencierStore, plansProductionStore} from '@root/stores/list_store';
import {theme} from '@root/theme';

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

  private readonly recomputePlanOrder = (): void => {
    const activePlansProd = plansProductionStore.getActivePlansProd();
    const operations = operationsStore.getData();
    if (activePlansProd && operations) {
      const orderedPlans = orderPlansProd(activePlansProd, operations, []);
      this.setState({
        // TODO - Fetch non prod here
        orderedPlans,
        plansProd: activePlansProd,
        operations,
      });
    }
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
    return <AppWrapper>{this.formatDay(this.state.day)}</AppWrapper>;
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
