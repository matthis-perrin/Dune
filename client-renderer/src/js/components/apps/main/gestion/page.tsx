import {range} from 'lodash-es';
import * as React from 'react';

import {Calendar} from '@root/components/apps/main/gestion/calendar';
import {Page} from '@root/components/apps/main/page';
import {Button} from '@root/components/core/button';
import {bridge} from '@root/lib/bridge';

import {ClientAppType} from '@shared/models';

interface Props {}

interface State {}

export class GestionPage extends React.Component<Props, State> {
  public static displayName = 'GestionPage';

  public constructor(props: Props) {
    super(props);
    this.state = {};
  }

  private readonly handleNewPlanProdClick = () => {
    bridge.openApp(ClientAppType.PlanProductionEditorApp).catch(err => console.error);
    bridge.createNewPlanProduction(Date.now(), 0).catch(err => console.error(err));
  };

  public renderDay(date: Date): JSX.Element {
    return (
      <div>
        {range(Math.ceil(Math.random() * 8)).map(i => (
          <div>{`Plan prod ${i}`}</div>
        ))}
      </div>
    );
  }

  public render(): JSX.Element {
    return (
      <Page>
        <Button onClick={this.handleNewPlanProdClick}>Nouveau plan de production</Button>
        <Calendar month={new Date().getMonth() + 1} year={new Date().getFullYear()}>
          {(date: Date) => <div>{this.renderDay(date)}</div>}
        </Calendar>
      </Page>
    );
  }
}
