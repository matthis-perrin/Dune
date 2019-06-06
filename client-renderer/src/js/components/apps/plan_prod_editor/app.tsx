import * as React from 'react';
import styled from 'styled-components';

import {
  SelectRefenteButton,
  SelectPapierButton,
  SelectPerfoButton,
  SelectPolyproButton,
} from '@root/components/apps/plan_prod_editor/select_buttons';
import {BobineMere} from '@root/components/common/bobine_mere';
import {Perfo as PerfoComponent} from '@root/components/common/perfo';
import {Refente as RefenteComponent} from '@root/components/common/refente';
import {Closable} from '@root/components/core/closable';
import {LoadingIndicator} from '@root/components/core/loading_indicator';
import {SizeMonitor} from '@root/components/core/size_monitor';
import {bridge} from '@root/lib/bridge';
import {CAPACITE_MACHINE} from '@root/lib/constants';
import {theme, getCouleurByName} from '@root/theme/default';

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

  private removePerfo(): void {
    bridge.setPlanPerfo(undefined).catch(console.error);
  }

  private removePapier(): void {
    bridge.setPlanPapier(undefined).catch(console.error);
  }

  private removePolypro(): void {
    bridge.setPlanPolypro(undefined).catch(console.error);
  }

  public render(): JSX.Element {
    const {planProduction} = this.state;

    if (!planProduction) {
      return <LoadingIndicator size="large" />;
    }

    const {
      selectedRefente,
      selectableRefentes,
      selectedPapier,
      selectablePapiers,
      selectedPerfo,
      selectablePerfos,
      selectedPolypro,
      selectablePolypros,
    } = planProduction;

    return (
      <SizeMonitor>
        {width => {
          const availableWidth = width - 4 * theme.page.padding;
          const pixelPerMM = availableWidth / CAPACITE_MACHINE;
          return (
            <Wrapper>
              {selectedRefente ? (
                <ClosableAlignRight onClose={this.removeRefente}>
                  <RefenteComponent refente={selectedRefente} pixelPerMM={pixelPerMM} />
                </ClosableAlignRight>
              ) : (
                <SelectRefenteButton selectable={selectableRefentes} />
              )}
              {selectedPapier ? (
                <Closable onClose={this.removePapier}>
                  <BobineMere
                    bobineMere={selectedPapier}
                    pixelPerMM={pixelPerMM}
                    decalage={selectedRefente && selectedRefente.decalage}
                    color={getCouleurByName(selectedPapier.couleurPapier)}
                  />
                </Closable>
              ) : (
                <SelectPapierButton selectable={selectablePapiers} />
              )}
              {selectedPerfo ? (
                <Closable onClose={this.removePerfo}>
                  <PerfoComponent perfo={selectedPerfo} pixelPerMM={pixelPerMM} />
                </Closable>
              ) : (
                <SelectPerfoButton selectable={selectablePerfos} />
              )}
              {selectedPolypro ? (
                <Closable onClose={this.removePolypro}>
                  <BobineMere
                    bobineMere={selectedPolypro}
                    pixelPerMM={pixelPerMM}
                    decalage={selectedRefente && selectedRefente.decalage}
                    color="#ccc"
                  />
                </Closable>
              ) : (
                <SelectPolyproButton selectable={selectablePolypros} />
              )}
            </Wrapper>
          );
        }}
      </SizeMonitor>
    );
  }
}

const Wrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ClosableAlignRight = styled(Closable)`
  display: flex;
  justify-content: flex-end;
`;
