import * as React from 'react';

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
    bridge.createNewPlanProduction().catch(err => console.error(err));
  };

  public render(): JSX.Element {
    return (
      <Page>
        <Button onClick={this.handleNewPlanProdClick}>Nouveau plan de production</Button>
      </Page>
    );
  }
}
