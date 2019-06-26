import {isEqual, range} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {BobinesForm} from '@root/components/apps/plan_prod_editor/bobines_form';
import {OrderableEncrier} from '@root/components/apps/plan_prod_editor/orderable_encrier';
import {ProductionTable} from '@root/components/apps/plan_prod_editor/production_table';
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
import {AutoFontWeight} from '@root/components/core/auto_font_weight';
import {Button} from '@root/components/core/button';
import {Closable} from '@root/components/core/closable';
import {LoadingIndicator} from '@root/components/core/loading_indicator';
import {SizeMonitor, SCROLLBAR_WIDTH} from '@root/components/core/size_monitor';
import {getBobineState, getStock} from '@root/lib/bobine';
import {bridge} from '@root/lib/bridge';
import {CAPACITE_MACHINE} from '@root/lib/constants';
import {bobinesQuantitiesStore} from '@root/stores/data_store';
import {stocksStore, cadencierStore} from '@root/stores/list_store';
import {theme, getColorInfoByName} from '@root/theme';

import {PlanProductionChanged} from '@shared/bridge/commands';
import {getPoseSize} from '@shared/lib/cliches';
import {EncrierColor} from '@shared/lib/encrier';
import {
  PlanProductionState,
  ClientAppType,
  BobineFilleWithPose,
  BobineState,
  Stock,
  BobineQuantities,
} from '@shared/models';

interface Props {}

interface State {
  planProduction?: PlanProductionState;
  reorderedBobines?: BobineFilleWithPose[];
  reorderedEncriers?: EncrierColor[];

  stocks?: Map<string, Stock[]>;
  cadencier?: Map<string, Map<number, number>>;
  bobineQuantities?: BobineQuantities[];

  tourCountSetByUser: boolean;
}

export class PlanProdEditorApp extends React.Component<Props, State> {
  public static displayName = 'PlanProdEditorApp';

  public constructor(props: Props) {
    super(props);
    this.state = {
      tourCountSetByUser: false,
    };
  }

  public componentDidMount(): void {
    bridge.addEventListener(PlanProductionChanged, this.refreshPlanProduction);
    stocksStore.addListener(this.handleStoresChanged);
    cadencierStore.addListener(this.handleStoresChanged);
    bobinesQuantitiesStore.addListener(this.handleStoresChanged);
    this.refreshPlanProduction();
  }

  public componentWillUnmount(): void {
    bridge.removeEventListener(PlanProductionChanged, this.refreshPlanProduction);
    stocksStore.removeListener(this.handleStoresChanged);
    cadencierStore.removeListener(this.handleStoresChanged);
    bobinesQuantitiesStore.removeListener(this.handleStoresChanged);
  }

  private readonly handleStoresChanged = (): void => {
    this.setState({
      stocks: stocksStore.getStockIndex(),
      cadencier: cadencierStore.getCadencierIndex(),
      bobineQuantities: bobinesQuantitiesStore.getData(),
    });
  };

  private computeTourCount(newPlanProduction: PlanProductionState): number | undefined {
    const {tourCount, selectedBobines} = newPlanProduction;
    if (tourCount !== undefined && this.state.tourCountSetByUser) {
      return tourCount;
    }
    const {stocks, cadencier, bobineQuantities} = this.state;
    if (!stocks || !cadencier || !bobineQuantities) {
      return tourCount;
    }
    for (const bobine of selectedBobines) {
      const {state, quantity} = getBobineState(bobine.ref, stocks, cadencier, bobineQuantities);
      if (state === BobineState.Rupture || state === BobineState.Alerte) {
        const poses = selectedBobines
          .filter(b => b.ref === bobine.ref)
          .reduce((acc, curr) => acc + getPoseSize(curr.pose), 0);
        return Math.ceil(quantity / poses);
      }
    }
    return undefined;
  }

  private readonly refreshPlanProduction = () => {
    document.title = 'Plan de production';
    bridge
      .getPlanProduction()
      .then(planProduction => {
        let hasRemoved = false;
        const oldPlanProduction = this.state.planProduction;
        if (oldPlanProduction) {
          hasRemoved =
            oldPlanProduction.selectedBobines.length > planProduction.selectedBobines.length ||
            (oldPlanProduction.selectedPapier && !planProduction.selectedPapier) ||
            (oldPlanProduction.selectedPerfo && !planProduction.selectedPerfo) ||
            (oldPlanProduction.selectedPolypro && !planProduction.selectedPolypro) ||
            (oldPlanProduction.selectedRefente && !planProduction.selectedRefente);
        }
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
          if (newState.planProduction) {
            const newTourCount = this.computeTourCount(newState.planProduction);
            if (newTourCount !== newState.planProduction.tourCount) {
              bridge.setPlanTourCount(newTourCount).catch(console.error);
            }
          }
          if (!hasRemoved && this.canAutoComplete()) {
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

  private readonly handleTourCountChange = (newTourCount?: number): void => {
    this.setState({tourCountSetByUser: true});
    bridge.setPlanTourCount(newTourCount).catch(console.error);
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
    const {
      planProduction,
      reorderedBobines,
      reorderedEncriers,
      stocks,
      cadencier,
      bobineQuantities,
    } = this.state;

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
      tourCount,
    } = planProduction;

    console.log(tourCount);

    return (
      <PlanProdEditorContainer style={{margin: 'auto'}}>
        <TopBar
          tourCount={tourCount}
          onTourCountChange={this.handleTourCountChange}
          planProdRef="19062101"
        />
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

            const selectedPapierStock =
              selectedPapier && stocks ? getStock(selectedPapier.ref, stocks) : 0;
            const papierBlock = selectedPapier ? (
              <Closable
                color={getColorInfoByName(selectedPapier.couleurPapier).dangerHex}
                onClose={this.removePapier}
              >
                <Bobine
                  size={selectedPapier.laize || 0}
                  pixelPerMM={pixelPerMM}
                  decalage={selectedRefente && selectedRefente.decalage}
                  color={getColorInfoByName(selectedPapier.couleurPapier).hex}
                  strokeWidth={theme.planProd.selectedStrokeWidth}
                >
                  <AutoFontWeight
                    style={{color: getColorInfoByName(selectedPapier.couleurPapier).textHex}}
                    fontSize={theme.planProd.elementsBaseLargeFontSize * pixelPerMM}
                  >
                    {`Bobine Papier ${selectedPapier.couleurPapier} ${
                      selectedPapier.ref
                    } - Largeur ${selectedPapier.laize} - ${
                      selectedPapier.grammage
                    }g - ${selectedPapierStock} en stock`}
                  </AutoFontWeight>
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
                  <AutoFontWeight
                    style={{color: getColorInfoByName(selectedPolypro.couleurPapier).textHex}}
                    fontSize={theme.planProd.elementsBaseLargeFontSize * pixelPerMM}
                  >
                    {`Bobine Polypro ${selectedPolypro.ref} - Largeur ${selectedPolypro.laize} - ${
                      selectedPolypro.grammage
                    }μg`}
                  </AutoFontWeight>
                </Bobine>
              </Closable>
            ) : (
              <SelectPolyproButton
                selectedRefente={selectedRefente}
                selectable={selectablePolypros}
                pixelPerMM={pixelPerMM}
              />
            );

            const padding = <div style={{height: theme.planProd.basePadding * pixelPerMM}} />;
            const halfPadding = (
              <div style={{height: (theme.planProd.basePadding * pixelPerMM) / 2}} />
            );

            const productionTable =
              planProduction.selectedBobines.length > 0 &&
              stocks &&
              cadencier &&
              bobineQuantities ? (
                <React.Fragment>
                  {padding}
                  <ProductionTable
                    width={availableWidth + leftPadding}
                    planProduction={planProduction}
                    stocks={stocks}
                    cadencier={cadencier}
                    bobineQuantities={bobineQuantities}
                    onRemove={(ref: string) => {
                      bridge.removePlanBobine(ref).catch(console.error);
                    }}
                  />
                </React.Fragment>
              ) : (
                <React.Fragment />
              );

            return (
              <Wrapper style={{width: availableWidth + leftPadding}}>
                {productionTable}
                {padding}
                <div style={{alignSelf: 'flex-end'}}>{bobinesBlock}</div>
                {padding}
                <div style={{alignSelf: 'flex-end'}}>{refenteBlock}</div>
                {halfPadding}
                <div style={{alignSelf: 'flex-end'}}>{encriersBlock}</div>
                {halfPadding}
                <div style={{alignSelf: 'flex-end'}}>{papierBlock}</div>
                {padding}
                <div style={{alignSelf: 'flex-start', paddingLeft: leftPadding}}>{perfoBlock}</div>
                {padding}
                <div style={{alignSelf: 'flex-end'}}>{polyproBlock}</div>
                {padding}
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

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 ${theme.page.padding}px;
`;

const ClosableAlignRight = styled(Closable)`
  display: flex;
  justify-content: flex-end;
`;
