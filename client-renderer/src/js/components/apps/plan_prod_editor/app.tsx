import {isEqual} from 'lodash-es';
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
import {Closable} from '@root/components/core/closable';
import {LoadingScreen} from '@root/components/core/loading_screen';
import {SizeMonitor, SCROLLBAR_WIDTH} from '@root/components/core/size_monitor';
import {WithColor} from '@root/components/core/with_colors';
import {getBobineState, getStockTerme, getStockReel} from '@root/lib/bobine';
import {bridge} from '@root/lib/bridge';
import {CAPACITE_MACHINE} from '@root/lib/constants';
import {padNumber} from '@root/lib/utils';
import {bobinesQuantitiesStore} from '@root/stores/data_store';
import {stocksStore, cadencierStore} from '@root/stores/list_store';
import {theme} from '@root/theme';

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

const MAX_PLAN_PROD_WIDTH = 900;
const INITIAL_SPEED = 180;
const ADJUSTED_WIDTH_WHEN_RENDERING_PDF = 1180;

interface Props {}

interface State {
  planProduction?: PlanProductionState;
  reorderedBobines?: BobineFilleWithPose[];
  reorderedEncriers?: EncrierColor[];
  bobinesMinimums: Map<string, number>;

  stocks?: Map<string, Stock[]>;
  cadencier?: Map<string, Map<number, number>>;
  bobineQuantities?: BobineQuantities[];

  tourCountSetByUser: boolean;
  speed: number;
}

export class PlanProdEditorApp extends React.Component<Props, State> {
  public static displayName = 'PlanProdEditorApp';

  public constructor(props: Props) {
    super(props);
    this.state = {
      tourCountSetByUser: false,
      speed: INITIAL_SPEED,
      bobinesMinimums: new Map<string, number>(),
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

  private computePlanProdRef(planProduction: PlanProductionState): string {
    const date = new Date(planProduction.day);
    const fullYearStr = date.getFullYear().toString();
    const lastTwoDigitYear = fullYearStr.slice(2, fullYearStr.length);
    const month = padNumber(date.getMonth() + 1, 2);
    const day = padNumber(date.getDate(), 2);
    const index = planProduction.indexInDay + 1;
    const planProdRef = `${lastTwoDigitYear}${month}${day}_${index}`;
    return planProdRef;
  }

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
            Boolean(oldPlanProduction.selectedPapier && !planProduction.selectedPapier) ||
            Boolean(oldPlanProduction.selectedPerfo && !planProduction.selectedPerfo) ||
            Boolean(oldPlanProduction.selectedPolypro && !planProduction.selectedPolypro) ||
            Boolean(oldPlanProduction.selectedRefente && !planProduction.selectedRefente);
        }
        const newState = {
          ...this.state,
          planProduction,
        };
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

  private readonly handleMiniUpdated = (ref: string, newMini: number): void => {
    const currentBobinesMinimums = Array.from(this.state.bobinesMinimums.entries());
    const newBobinesMinimums = new Map<string, number>(currentBobinesMinimums);
    newBobinesMinimums.set(ref, newMini);
    this.setState({bobinesMinimums: newBobinesMinimums});
  };

  private readonly handleSpeedChange = (speed: number): void => {
    this.setState({speed});
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

  // private canClear(): boolean {
  //   const {planProduction} = this.state;
  //   if (!planProduction) {
  //     return false;
  //   }

  //   const {
  //     selectedRefente,
  //     selectedPapier,
  //     selectedPerfo,
  //     selectedPolypro,
  //     selectedBobines,
  //   } = planProduction;

  //   return (
  //     selectedRefente !== undefined ||
  //     selectedPapier !== undefined ||
  //     selectedPerfo !== undefined ||
  //     selectedPolypro !== undefined ||
  //     selectedBobines.length > 0
  //   );
  // }

  // private clear(): void {
  //   bridge.clearPlan().catch(console.error);
  // }

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
      speed,
      bobinesMinimums,
    } = this.state;

    if (!planProduction) {
      return <LoadingScreen />;
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

    return (
      <SizeMonitor>
        {(width, height, hasVerticalScrollbar) => {
          // Padding for the extra space taken by the bobine offset
          const leftPadding =
            (CURVE_EXTRA_SPACE * (width - 2 * theme.page.padding)) / (1 - 2 * CURVE_EXTRA_SPACE);
          const printingWidth = width < 1000 ? ADJUSTED_WIDTH_WHEN_RENDERING_PDF : undefined;
          const isPrinting = printingWidth !== undefined;
          const adjustedWidthForPrinting = printingWidth ? printingWidth : width;
          const availableWidth =
            adjustedWidthForPrinting -
            2 * theme.page.padding -
            leftPadding -
            (hasVerticalScrollbar ? 0 : SCROLLBAR_WIDTH);

          const adjustedAvailableWidth = isPrinting
            ? availableWidth
            : Math.min(MAX_PLAN_PROD_WIDTH, availableWidth);
          const pixelPerMM = adjustedAvailableWidth / CAPACITE_MACHINE;

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

          const selectedPapierStockReel =
            selectedPapier && stocks ? getStockReel(selectedPapier.ref, stocks) : 0;
          const selectedPapierStockTerme =
            selectedPapier && stocks ? getStockTerme(selectedPapier.ref, stocks) : 0;
          const papierBlock = selectedPapier ? (
            <WithColor color={selectedPapier.couleurPapier}>
              {color => (
                <Closable color={color.closeHex} onClose={this.removePapier}>
                  <Bobine
                    size={selectedPapier.laize || 0}
                    pixelPerMM={pixelPerMM}
                    decalage={selectedRefente && selectedRefente.decalage}
                    color={color.backgroundHex}
                    strokeWidth={theme.planProd.selectedStrokeWidth}
                  >
                    <AutoFontWeight
                      style={{color: color.textHex, textAlign: 'center'}}
                      fontSize={theme.planProd.elementsBaseLargeFontSize * pixelPerMM}
                    >
                      {`Bobine Papier ${selectedPapier.couleurPapier} ${
                        selectedPapier.ref
                      } - Largeur ${selectedPapier.laize} - ${
                        selectedPapier.grammage
                      }g - ${selectedPapierStockReel} (à terme ${selectedPapierStockTerme})`}
                    </AutoFontWeight>
                  </Bobine>
                </Closable>
              )}
            </WithColor>
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

          const selectedPolyproStockReel =
            selectedPolypro && stocks ? getStockReel(selectedPolypro.ref, stocks) : 0;
          const selectedPolyproStockTerme =
            selectedPolypro && stocks ? getStockTerme(selectedPolypro.ref, stocks) : 0;
          const polyproBlock = selectedPolypro ? (
            <WithColor color={selectedPolypro.couleurPapier}>
              {color => (
                <Closable color={theme.planProd.closeDefaultColor} onClose={this.removePolypro}>
                  <Bobine
                    size={selectedPolypro.laize || 0}
                    pixelPerMM={pixelPerMM}
                    decalage={selectedRefente && selectedRefente.decalage}
                    color={color.backgroundHex}
                    strokeWidth={theme.planProd.selectedStrokeWidth}
                  >
                    <AutoFontWeight
                      style={{color: color.textHex, textAlign: 'center'}}
                      fontSize={theme.planProd.elementsBaseLargeFontSize * pixelPerMM}
                    >
                      {`Bobine Polypro ${selectedPolypro.ref} - Largeur ${
                        selectedPolypro.laize
                      } - ${
                        selectedPolypro.grammage
                      }μg - ${selectedPolyproStockReel} (à terme ${selectedPolyproStockTerme})`}
                    </AutoFontWeight>
                  </Bobine>
                </Closable>
              )}
            </WithColor>
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
            planProduction.selectedBobines.length > 0 && stocks && cadencier && bobineQuantities ? (
              <React.Fragment>
                {padding}
                <ProductionTable
                  width={adjustedAvailableWidth + leftPadding}
                  planProduction={planProduction}
                  stocks={stocks}
                  cadencier={cadencier}
                  bobineQuantities={bobineQuantities}
                  canRemove={!isPrinting}
                  onRemove={(ref: string) => {
                    bridge.removePlanBobine(ref).catch(console.error);
                  }}
                  minimums={bobinesMinimums}
                  onMiniUpdated={this.handleMiniUpdated}
                />
              </React.Fragment>
            ) : (
              <React.Fragment />
            );

          const planProductionRef = this.computePlanProdRef(planProduction);

          return (
            <PlanProdEditorContainer>
              <TopBar
                tourCount={tourCount}
                speed={speed}
                onTourCountChange={this.handleTourCountChange}
                onSpeedChange={this.handleSpeedChange}
                planProdRef={planProductionRef}
                planProduction={planProduction}
                bobinesMinimums={bobinesMinimums}
                reorderedEncriers={reorderedEncriers}
                isPrinting={isPrinting}
              />
              <Wrapper style={{width: adjustedAvailableWidth + leftPadding}}>
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
            </PlanProdEditorContainer>
          );
        }}
      </SizeMonitor>
    );
  }
}

const PlanProdEditorContainer = styled.div`
  width: 100%;
  margin: auto;
  padding-top: ${theme.planProd.topBarHeight}px;
  background-color: ${theme.planProd.contentBackgroundColor};
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 ${theme.page.padding}px;
  margin: auto;
`;

const ClosableAlignRight = styled(Closable)`
  display: flex;
  justify-content: flex-end;
`;
