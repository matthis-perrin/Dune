import * as React from 'react';
import styled from 'styled-components';

import {SelectRefenteButton} from '@root/components/apps/plan_prod_editor/select_buttons';
import {Refente as RefenteComponent} from '@root/components/common/refente';
import {Closable} from '@root/components/core/closable';
import {LoadingIndicator} from '@root/components/core/loading_indicator';
import {SizeMonitor} from '@root/components/core/size_monitor';
import {bridge} from '@root/lib/bridge';
import {CAPACITE_MACHINE} from '@root/lib/constants';
import {theme} from '@root/theme/default';

import {PlanProductionChanged} from '@shared/bridge/commands';
import {PlanProductionState} from '@shared/models';

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
      .catch(err => console.error(err));
  };

  private removeRefente(): void {
    bridge.setPlanRefente(undefined).catch(console.error);
  }

  public render(): JSX.Element {
    const {planProduction} = this.state;

    if (!planProduction) {
      return <LoadingIndicator size="large" />;
    }

    const {selectedRefente, selectableRefentes} = planProduction;

    return (
      <SizeMonitor>
        {width => {
          const availableWidth = width - 2 * theme.page.padding;
          const pixelPerMM = availableWidth / CAPACITE_MACHINE;
          return (
            <div style={{padding: theme.page.padding}}>
              {selectedRefente ? (
                <ClosableAlignRight onClose={this.removeRefente}>
                  <RefenteComponent refente={selectedRefente} pixelPerMM={pixelPerMM} />
                </ClosableAlignRight>
              ) : (
                <SelectRefenteButton selectable={selectableRefentes} />
              )}
            </div>
          );
        }}
      </SizeMonitor>
    );
  }
}

const ClosableAlignRight = styled(Closable)`
  display: flex;
  justify-content: flex-end;
`;
