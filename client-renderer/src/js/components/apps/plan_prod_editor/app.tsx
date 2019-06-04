import * as React from 'react';

import {Button} from '@root/components/core/button';
import {LoadingIndicator} from '@root/components/core/loading_indicator';
import {bridge} from '@root/lib/bridge';

import {PlanProductionChanged} from '@shared/bridge/commands';
import {ClientAppType, PlanProductionState} from '@shared/models';

interface Props {}

interface State {
  planProduction?: PlanProductionState;
}

export class PlanProdEditorApp extends React.Component<Props, State> {
  public static displayName = 'PlanProdEditorApp';

  public constructor(props: Props) {
    super(props);
    this.state = {};
  }

  public componentDidMount(): void {
    bridge.addEventListener(PlanProductionChanged, this.refreshPlanProduction);
    this.refreshPlanProduction();
  }

  public componentWillUnmount(): void {
    bridge.removeEventListener(PlanProductionChanged, this.refreshPlanProduction);
  }

  private readonly refreshPlanProduction = () => {
    document.title = 'Plan de production';
    bridge
      .getPlanProduction()
      .then(planProduction => this.setState({planProduction}))
      .catch(err => console.error);
  };

  public render(): JSX.Element {
    const {planProduction} = this.state;

    if (!planProduction) {
      return <LoadingIndicator size="large" />;
    }
    return (
      <Button
        onClick={() =>
          bridge.openApp(ClientAppType.RefentePickerApp, planProduction.selectableRefentes)
        }
      >
        {`Select Refente (${planProduction.selectableRefentes.length})`}
      </Button>
    );
  }
}
