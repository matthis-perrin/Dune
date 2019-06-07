import * as React from 'react';
import styled from 'styled-components';

import {
  SelectRefenteButton,
  SelectPapierButton,
  SelectPerfoButton,
  SelectPolyproButton,
} from '@root/components/apps/plan_prod_editor/select_buttons';
import {BobineMere, CURVE_EXTRA_SPACE} from '@root/components/common/bobine_mere';
import {Perfo as PerfoComponent} from '@root/components/common/perfo';
import {Refente as RefenteComponent} from '@root/components/common/refente';
import {Button} from '@root/components/core/button';
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

  private canAutoComplete(): boolean {
    const {planProduction} = this.state;
    if (!planProduction) {
      return false;
    }
    const {
      selectableRefentes,
      selectablePapiers,
      selectablePerfos,
      selectablePolypros,
    } = planProduction;

    const allSelectableWithSingles = [
      selectableRefentes,
      selectablePapiers,
      selectablePerfos,
      selectablePolypros,
    ].filter(arr => arr.length === 1);

    return allSelectableWithSingles.length > 0;
  }

  private readonly autoComplete = () => {
    const {planProduction} = this.state;
    if (!planProduction) {
      return false;
    }
    const {
      selectableRefentes,
      selectablePapiers,
      selectablePerfos,
      selectablePolypros,
    } = planProduction;

    const promises: Promise<void>[] = [];
    if (selectablePapiers.length === 1) {
      promises.push(bridge.setPlanPapier(selectablePapiers[0].ref));
    }
    if (selectablePolypros.length === 1) {
      promises.push(bridge.setPlanPolypro(selectablePolypros[0].ref));
    }
    if (selectablePerfos.length === 1) {
      promises.push(bridge.setPlanPerfo(selectablePerfos[0].ref));
    }
    if (selectableRefentes.length === 1) {
      promises.push(bridge.setPlanRefente(selectableRefentes[0].ref));
    }
    Promise.all(promises).catch(console.error);
  };

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
      <div>
        <SizeMonitor>
          {width => {
            // Padding for the extra space taken by the bobine offset
            const leftPadding =
              (CURVE_EXTRA_SPACE * (width - 2 * theme.page.padding)) / (1 - CURVE_EXTRA_SPACE);
            const availableWidth = width - 2 * theme.page.padding - leftPadding;
            const pixelPerMM = availableWidth / CAPACITE_MACHINE;

            const refenteBlock = selectedRefente ? (
              <ClosableAlignRight onClose={this.removeRefente}>
                <RefenteComponent refente={selectedRefente} pixelPerMM={pixelPerMM} />
              </ClosableAlignRight>
            ) : (
              <SelectRefenteButton selectable={selectableRefentes} pixelPerMM={pixelPerMM} />
            );

            const papierBlock = selectedPapier ? (
              <Closable onClose={this.removePapier}>
                <BobineMere
                  size={selectedPapier.laize || 0}
                  pixelPerMM={pixelPerMM}
                  decalage={selectedRefente && selectedRefente.decalage}
                  color={getCouleurByName(selectedPapier.couleurPapier)}
                >
                  {`Papier ${selectedPapier.couleurPapier} ${selectedPapier.ref} - Largeur ${
                    selectedPapier.laize
                  } - Grammage ${selectedPapier.grammage}`}
                </BobineMere>
              </Closable>
            ) : (
              <SelectPapierButton
                selectedRefente={selectedRefente}
                selectable={selectablePapiers}
                pixelPerMM={pixelPerMM}
              />
            );

            const perfoBlock = selectedPerfo ? (
              <Closable onClose={this.removePerfo}>
                <PerfoComponent perfo={selectedPerfo} pixelPerMM={pixelPerMM} />
              </Closable>
            ) : (
              <SelectPerfoButton selectable={selectablePerfos} pixelPerMM={pixelPerMM} />
            );

            const polyproBlock = selectedPolypro ? (
              <Closable onClose={this.removePolypro}>
                <BobineMere
                  size={selectedPolypro.laize || 0}
                  pixelPerMM={pixelPerMM}
                  decalage={selectedRefente && selectedRefente.decalage}
                  color="#f0f0f0"
                >
                  {`Polypro ${selectedPolypro.ref} - Largeur ${selectedPolypro.laize} - Grammage ${
                    selectedPolypro.grammage
                  }`}
                </BobineMere>
              </Closable>
            ) : (
              <SelectPolyproButton
                selectedRefente={selectedRefente}
                selectable={selectablePolypros}
                pixelPerMM={pixelPerMM}
              />
            );

            return (
              <Wrapper style={{width: width - 2 * theme.page.padding}}>
                <div style={{alignSelf: 'flex-end'}}>{refenteBlock}</div>
                <Padding />
                <div style={{alignSelf: 'flex-end'}}>{papierBlock}</div>
                <Padding />
                <div style={{alignSelf: 'flex-start', marginLeft: leftPadding}}>{perfoBlock}</div>
                <Padding />
                <div style={{alignSelf: 'flex-end'}}>{polyproBlock}</div>
              </Wrapper>
            );
          }}
        </SizeMonitor>
        {this.canAutoComplete() ? (
          <Button onClick={this.autoComplete}>Auto complète</Button>
        ) : (
          <React.Fragment />
        )}
      </div>
    );
  }
}

const Padding = styled.div`
  height: 24px;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${theme.page.padding}px;
  background-color: #dedede;
`;

const ClosableAlignRight = styled(Closable)`
  display: flex;
  justify-content: flex-end;
`;
