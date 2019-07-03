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
}

export class GestionPage extends React.Component<Props, State> {
  public static displayName = 'GestionPage';

  public constructor(props: Props) {
    super(props);
    this.state = {};
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
          <PlanProdTile data={p.data} />
        ))}
      </div>
    );
  }

  public render(): JSX.Element {
    return (
      <Page>
        {/* <Button onClick={this.handleNewPlanProdClick}>Nouveau plan de production</Button> */}
        <Calendar month={new Date().getMonth()} year={new Date().getFullYear()}>
          {(date: Date) => <div>{this.renderDay(date)}</div>}
        </Calendar>
      </Page>
    );
  }
}
