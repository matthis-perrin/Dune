import * as React from 'react';

import {SizeMonitor} from '@root/components/core/size_monitor';
import {bridge} from '@root/lib/bridge';

import {PlanProductionChanged} from '@shared/bridge/commands';
import {BobineMere} from '@shared/models';

interface Props {
  polypros: BobineMere[];
}

export class PolyproPickerApp extends React.Component<Props> {
  public static displayName = 'PolyproPickerApp';

  public componentDidMount(): void {
    bridge.addEventListener(PlanProductionChanged, this.refreshPlanProduction);
  }

  public componentWillUnmount(): void {
    bridge.removeEventListener(PlanProductionChanged, this.refreshPlanProduction);
  }

  private readonly refreshPlanProduction = async (): Promise<void> => {
    const planProduction = await bridge.getPlanProduction();
    document.title = `Choix du polypro (${planProduction.selectablePolypros.length})`;
    this.setState({planProd: planProduction});
  };

  private readonly handlePolyproSelected = (refente: BobineMere) => {
    bridge
      .setPlanPolypro(refente.ref)
      .then(() => {
        bridge.closeApp().catch(console.error);
      })
      .catch(console.error);
  };

  public render(): JSX.Element {
    const {polypros} = this.props;
    return (
      <SizeMonitor>
        {width => {
          return <div>{`${width}px / ${polypros.length}`}</div>;
        }}
      </SizeMonitor>
    );
  }
}
