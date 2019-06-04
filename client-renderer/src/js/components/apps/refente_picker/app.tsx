import * as React from 'react';

import {Refente as RefenteComponent} from '@root/components/common/refente';
import {SizeMonitor} from '@root/components/core/size_monitor';
import {bridge} from '@root/lib/bridge';
import {theme} from '@root/theme/default';

import {PlanProductionChanged} from '@shared/bridge/commands';
import {Refente} from '@shared/models';

interface Props {
  refentes: Refente[];
}

export class RefentePickerApp extends React.Component<Props> {
  public static displayName = 'RefentePickerApp';

  public componentDidMount(): void {
    bridge.addEventListener(PlanProductionChanged, this.refreshPlanProduction);
  }

  public componentWillUnmount(): void {
    bridge.removeEventListener(PlanProductionChanged, this.refreshPlanProduction);
  }

  private readonly refreshPlanProduction = async (): Promise<void> => {
    document.title = 'Plan de production';
    const planProduction = await bridge.getPlanProduction();
    this.setState({planProd: planProduction});
  };

  public render(): JSX.Element {
    const {refentes} = this.props;
    return (
      <SizeMonitor>
        {width => {
          const CAPACITE_MACHINE = 980;
          const pixelPerMM = (width - 2 * theme.page.padding) / CAPACITE_MACHINE;
          return (
            <div style={{width}}>
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
                {refentes.map(r => (
                  <RefenteComponent refente={r} pixelPerMM={pixelPerMM} />
                ))}
              </div>
            </div>
          );
        }}
      </SizeMonitor>
    );
  }
}
