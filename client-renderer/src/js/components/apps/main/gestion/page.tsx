import * as React from 'react';

import {Calendar} from '@root/components/apps/main/gestion/calendar';
import {PlanProdTile} from '@root/components/apps/main/gestion/plan_prod_tile';
import {Page} from '@root/components/apps/main/page';
import {Button} from '@root/components/core/button';
import {bridge} from '@root/lib/bridge';
import {plansProductionStore} from '@root/stores/list_store';

import {ClientAppType, PlanProduction} from '@shared/models';

interface Props {}

interface State {
  plansProduction?: Map<number, PlanProduction[]>;
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
    plansProductionStore.addListener(this.handleStoresChanged);
  }

  public componentWillUnmount(): void {
    plansProductionStore.removeListener(this.handleStoresChanged);
  }

  private readonly handleStoresChanged = (): void => {
    this.setState({
      plansProduction: plansProductionStore.getIndex(),
    });
  };

  private readonly goToNextMonth = (): void => {
    const {year, month} = this.state;
    const newYear = month === 11 ? year + 1 : year;
    const newMonth = month === 11 ? 0 : month + 1;
    this.setState({year: newYear, month: newMonth});
  };

  private readonly goToPreviousMonth = (): void => {
    const {year, month} = this.state;
    const newYear = month === 0 ? year - 1 : year;
    const newMonth = month === 0 ? 11 : month - 1;
    this.setState({year: newYear, month: newMonth});
  };

  private readonly handleNewPlanProdClick = () => {
    bridge.openApp(ClientAppType.PlanProductionEditorApp).catch(err => console.error);
    bridge.createNewPlanProduction(Date.now(), 0).catch(err => console.error(err));
  };

  public renderDay(date: Date): JSX.Element {
    const {plansProduction} = this.state;
    if (!plansProduction) {
      return <div />;
    }
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const planForDay = plansProduction.get(startOfDay) || [];
    planForDay.sort((p1, p2) => p1.data.indexInDay - p2.data.indexInDay);
    return (
      <div>
        {planForDay.map(p => (
          <PlanProdTile planProd={p} />
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
