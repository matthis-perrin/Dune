import {isEqual} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {BobinesForm} from '@root/components/apps/plan_prod_editor/bobines_form';
import {OrderableEncrier} from '@root/components/apps/plan_prod_editor/orderable_encrier';
import {
  SelectRefenteButton,
  SelectPapierButton,
  SelectPerfoButton,
  SelectPolyproButton,
} from '@root/components/apps/plan_prod_editor/select_buttons';
import {TopBar} from '@root/components/apps/plan_prod_editor/top_bar';
import {Bobine, CURVE_EXTRA_SPACE} from '@root/components/common/bobine';
import {Perfo as PerfoComponent} from '@root/components/common/perfo';
import {Refente as RefenteComponent} from '@root/components/common/refente';
import {Button} from '@root/components/core/button';
import {Closable} from '@root/components/core/closable';
import {LoadingIndicator} from '@root/components/core/loading_indicator';
import {SizeMonitor, SCROLLBAR_WIDTH} from '@root/components/core/size_monitor';
import {bridge} from '@root/lib/bridge';
import {CAPACITE_MACHINE} from '@root/lib/constants';
import {theme, couleurByName, getColorInfoByName} from '@root/theme';

import {PlanProductionChanged} from '@shared/bridge/commands';
import {EncrierColor} from '@shared/lib/encrier';
import {PlanProductionState, ClientAppType, BobineFilleWithPose} from '@shared/models';

interface Props {}

interface State {
  planProduction?: PlanProductionState;
  reorderedBobines?: BobineFilleWithPose[];
  reorderedEncriers?: EncrierColor[];
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
      .then(planProduction => {
        const newState: Partial<State> = {planProduction};
        if (
          this.state.planProduction &&
          (this.state.reorderedBobines || this.state.reorderedEncriers) &&
          !isEqual(planProduction.selectedBobines, this.state.planProduction.selectedBobines)
        ) {
          newState.reorderedBobines = undefined;
          newState.reorderedEncriers = undefined;
        }
        this.setState(newState, () => {
          if (this.canAutoComplete()) {
            this.autoComplete();
          }
        });
        if (planProduction.selectableBobines.length === 0) {
          bridge.closeAppOfType(ClientAppType.BobinesPickerApp).catch(console.error);
        }
      })
      .catch(err => console.error(err));
  };

  private readonly handleBobineReorder = (newBobines: BobineFilleWithPose[]): void => {
    this.setState({reorderedBobines: newBobines});
  };

  private readonly handleEncrierReorder = (newEncriers: EncrierColor[]): void => {
    this.setState({reorderedEncriers: newEncriers});
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

  private canClear(): boolean {
    const {planProduction} = this.state;
    if (!planProduction) {
      return false;
    }

    const {
      selectedRefente,
      selectedPapier,
      selectedPerfo,
      selectedPolypro,
      selectedBobines,
    } = planProduction;

    return (
      selectedRefente !== undefined ||
      selectedPapier !== undefined ||
      selectedPerfo !== undefined ||
      selectedPolypro !== undefined ||
      selectedBobines.length > 0
    );
  }

  private clear(): void {
    bridge.clearPlan().catch(console.error);
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
    const {planProduction, reorderedBobines, reorderedEncriers} = this.state;

    if (!planProduction) {
      return <LoadingIndicator size="large" />;
    }

    const {
      selectedBobines,
      selectableBobines,
      selectedRefente,
      selectableRefentes,
      selectedPapier,
      selectablePapiers,
      selectedPerfo,
      selectablePerfos,
      selectedPolypro,
      selectablePolypros,
      couleursEncrier,
    } = planProduction;

    return (
      <PlanProdEditorContainer style={{margin: 'auto'}}>
        <TopBar planProdRef="19062101" />
        {/* <ButtonContainer>
          {this.canAutoComplete() ? (
            <Button onClick={this.autoComplete}>Auto complète</Button>
          ) : (
            <React.Fragment />
          )}
          {this.canClear() ? <Button onClick={this.clear}>Effacer</Button> : <React.Fragment />}
          {`Computed in ${planProduction.calculationTime}ms`}
        </ButtonContainer> */}
        <SizeMonitor>
          {width => {
            // Padding for the extra space taken by the bobine offset
            const leftPadding =
              (CURVE_EXTRA_SPACE * (width - 2 * theme.page.padding)) / (1 - 2 * CURVE_EXTRA_SPACE);
            const availableWidth =
              width - 2 * theme.page.padding - leftPadding - SCROLLBAR_WIDTH - 20;
            const pixelPerMM = availableWidth / CAPACITE_MACHINE;

            const bobinesBlock = (
              <BobinesForm
                selectedBobines={reorderedBobines || selectedBobines}
                selectableBobines={selectableBobines}
                selectedRefente={selectedRefente}
                pixelPerMM={pixelPerMM}
                onReorder={this.handleBobineReorder}
              />
            );

            const refenteBlock = selectedRefente ? (
              <ClosableAlignRight
                color={theme.planProd.closeDefaultColor}
                onClose={this.removeRefente}
              >
                <RefenteComponent refente={selectedRefente} pixelPerMM={pixelPerMM} />
              </ClosableAlignRight>
            ) : (
              <SelectRefenteButton selectable={selectableRefentes} pixelPerMM={pixelPerMM} />
            );

            const encriersBlock = (
              <OrderableEncrier
                pixelPerMM={pixelPerMM}
                selectedBobines={reorderedBobines || selectedBobines}
                selectedRefente={selectedRefente}
                allValidEncrierColors={couleursEncrier}
                encrierColors={reorderedEncriers || couleursEncrier[0] || []}
                onReorder={this.handleEncrierReorder}
              />
            );

            const papierBlock = selectedPapier ? (
              <Closable
                color={getColorInfoByName(selectedPapier.couleurPapier).dangerHex}
                onClose={this.removePapier}
              >
                <Bobine
                  size={selectedPapier.laize || 0}
                  pixelPerMM={pixelPerMM}
                  decalage={selectedRefente && selectedRefente.decalage}
                  color={couleurByName(selectedPapier.couleurPapier)}
                  strokeWidth={theme.planProd.selectedStrokeWidth}
                >
                  {`Bobine Papier ${selectedPapier.couleurPapier} ${selectedPapier.ref} - Largeur ${
                    selectedPapier.laize
                  } - ${selectedPapier.grammage}g`}
                </Bobine>
              </Closable>
            ) : (
              <SelectPapierButton
                selectedRefente={selectedRefente}
                selectable={selectablePapiers}
                pixelPerMM={pixelPerMM}
              />
            );

            const perfoBlock = selectedPerfo ? (
              <Closable color={theme.planProd.closeDefaultColor} onClose={this.removePerfo}>
                <PerfoComponent perfo={selectedPerfo} pixelPerMM={pixelPerMM} />
              </Closable>
            ) : (
              <SelectPerfoButton selectable={selectablePerfos} pixelPerMM={pixelPerMM} />
            );

            const polyproBlock = selectedPolypro ? (
              <Closable color={theme.planProd.closeDefaultColor} onClose={this.removePolypro}>
                <Bobine
                  size={selectedPolypro.laize || 0}
                  pixelPerMM={pixelPerMM}
                  decalage={selectedRefente && selectedRefente.decalage}
                  color={getColorInfoByName(selectedPolypro.couleurPapier).hex}
                  strokeWidth={theme.planProd.selectedStrokeWidth}
                >
                  {`Bobine Polypro ${selectedPolypro.ref} - Largeur ${selectedPolypro.laize} - ${
                    selectedPolypro.grammage
                  }g`}
                </Bobine>
              </Closable>
            ) : (
              <SelectPolyproButton
                selectedRefente={selectedRefente}
                selectable={selectablePolypros}
                pixelPerMM={pixelPerMM}
              />
            );

            return (
              <Wrapper style={{width: availableWidth + leftPadding}}>
                <div style={{alignSelf: 'flex-end'}}>{bobinesBlock}</div>
                <Padding />
                <div style={{alignSelf: 'flex-end'}}>{refenteBlock}</div>
                <Padding />
                <div style={{alignSelf: 'flex-end'}}>{encriersBlock}</div>
                <Padding />
                <div style={{alignSelf: 'flex-end'}}>{papierBlock}</div>
                <Padding />
                <div style={{alignSelf: 'flex-start', paddingLeft: leftPadding}}>{perfoBlock}</div>
                <Padding />
                <div style={{alignSelf: 'flex-end'}}>{polyproBlock}</div>
              </Wrapper>
            );
          }}
        </SizeMonitor>
      </PlanProdEditorContainer>
    );
  }
}

const PlanProdEditorContainer = styled.div`
  width: 100%;
  padding-top: ${theme.planProd.topBarHeight}px;
  background-color: ${theme.planProd.contentBackgroundColor};
`;

const Padding = styled.div`
  height: 24px;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${theme.page.padding}px;
  border-bottom: solid 2px black;
`;

const ClosableAlignRight = styled(Closable)`
  display: flex;
  justify-content: flex-end;
`;

const ButtonContainer = styled.div`
  display: flex;
  align-items: center;
  height: 60px;
  justify-content: center;
  border-top: solid 2px black;
  border-bottom: solid 2px black;
`;
