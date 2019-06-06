import * as React from 'react';

import {SizeMonitor} from '@root/components/core/size_monitor';
import {bridge} from '@root/lib/bridge';

import {PlanProductionChanged} from '@shared/bridge/commands';
import {BobineMere} from '@shared/models';

interface Props {
  papiers: BobineMere[];
}

export class PapierPickerApp extends React.Component<Props> {
  public static displayName = 'PapierPickerApp';

  public componentDidMount(): void {
    bridge.addEventListener(PlanProductionChanged, this.refreshPlanProduction);
  }

  public componentWillUnmount(): void {
    bridge.removeEventListener(PlanProductionChanged, this.refreshPlanProduction);
  }

  private readonly refreshPlanProduction = async (): Promise<void> => {
    const planProduction = await bridge.getPlanProduction();
    document.title = `Choix du papier (${planProduction.selectablePapiers.length})`;
    this.setState({planProd: planProduction});
  };

  private readonly handlePapierSelected = (refente: BobineMere) => {
    bridge
      .setPlanPapier(refente.ref)
      .then(() => {
        bridge.closeApp().catch(console.error);
      })
      .catch(console.error);
  };

  public render(): JSX.Element {
    const {papiers} = this.props;
    return (
      <SizeMonitor>
        {width => {
          return <div>{`${width}px / ${papiers.length}`}</div>;
        }}
      </SizeMonitor>
    );
  }
}
