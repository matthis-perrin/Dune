import * as React from 'react';

import {Calendar} from '@root/components/apps/main/gestion/calendar';
import {PlanProdTile} from '@root/components/apps/main/gestion/plan_prod_tile';
import {Page} from '@root/components/apps/main/page';
import {Button} from '@root/components/core/button';
import {bridge} from '@root/lib/bridge';
import {bobinesQuantitiesStore} from '@root/stores/data_store';
import {plansProductionStore, stocksStore, cadencierStore} from '@root/stores/list_store';

import {ClientAppType, PlanProduction, Stock, BobineQuantities} from '@shared/models';

const LAST_MONTH = 11;

interface Props {}

interface State {
  plansProduction?: Map<number, PlanProduction[]>;
  stocks?: Map<string, Stock[]>;
  cadencier?: Map<string, Map<number, number>>;
  bobineQuantities?: BobineQuantities[];
  month: number;
  year: number;
}

export class GestionPage extends React.Component<Props, State> {
  public static displayName = 'GestionPage';

  public constructor(props: Props) {
    super(props);
    this.state = {
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
    };
  }

  public componentDidMount(): void {
    stocksStore.addListener(this.handleStoresChanged);
    cadencierStore.addListener(this.handleStoresChanged);
    bobinesQuantitiesStore.addListener(this.handleStoresChanged);
    plansProductionStore.addListener(this.handleStoresChanged);
  }

  public componentWillUnmount(): void {
    stocksStore.removeListener(this.handleStoresChanged);
    cadencierStore.removeListener(this.handleStoresChanged);
    bobinesQuantitiesStore.removeListener(this.handleStoresChanged);
    plansProductionStore.removeListener(this.handleStoresChanged);
  }

  private readonly handleStoresChanged = (): void => {
    this.setState({
      stocks: stocksStore.getStockIndex(),
      cadencier: cadencierStore.getCadencierIndex(),
      bobineQuantities: bobinesQuantitiesStore.getData(),
      plansProduction: plansProductionStore.getIndex(),
    });
  };

  private readonly goToNextMonth = (): void => {
    const {year, month} = this.state;
    const newYear = month === LAST_MONTH ? year + 1 : year;
    const newMonth = month === LAST_MONTH ? 0 : month + 1;
    this.setState({year: newYear, month: newMonth});
  };

  private readonly goToPreviousMonth = (): void => {
    const {year, month} = this.state;
    const newYear = month === 0 ? year - 1 : year;
    const newMonth = month === 0 ? LAST_MONTH : month - 1;
    this.setState({year: newYear, month: newMonth});
  };

  private readonly handleNewPlanProdClick = () => {
    bridge
      .createNewPlanProduction(Date.now(), 0)
      .then(() => {
        bridge.openApp(ClientAppType.PlanProductionEditorApp).catch(console.error);
      })
      .catch(err => console.error(err));
  };

  public renderDay(date: Date): JSX.Element {
    const {plansProduction, stocks, cadencier, bobineQuantities} = this.state;
    if (!plansProduction || !stocks || !cadencier || !bobineQuantities) {
      return <div />;
    }
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const planForDay = plansProduction.get(startOfDay) || [];
    planForDay.sort((p1, p2) => p1.data.indexInDay - p2.data.indexInDay);
    return (
      <div>
        {planForDay.map(p => (
          <PlanProdTile
            planProd={p}
            stocks={stocks}
            cadencier={cadencier}
            bobineQuantities={bobineQuantities}
          />
        ))}
      </div>
    );
  }

  public render(): JSX.Element {
    const {month, year} = this.state;
    return (
      <Page>
        <Calendar
          month={month}
          year={year}
          onNextClick={this.goToNextMonth}
          onPreviousClick={this.goToPreviousMonth}
        >
          {(date: Date) => <div>{this.renderDay(date)}</div>}
        </Calendar>
        <Button style={{margin: '16px 0'}} onClick={this.handleNewPlanProdClick}>
          Nouveau plan de production
        </Button>
      </Page>
    );
  }
}
