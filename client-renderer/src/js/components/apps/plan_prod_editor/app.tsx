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
import {computePlanProdRef} from '@root/lib/plan_prod';
import {padNumber, numberWithSeparator} from '@root/lib/utils';
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
  PlanProductionData,
  PlanProductionStatus,
  BobineMere,
  Color,
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
      const {state, quantity, stock} = getBobineState(
        bobine.ref,
        stocks,
        cadencier,
        bobineQuantities
      );
      if (state === BobineState.Imperatif) {
        const poses = selectedBobines
          .filter(b => b.ref === bobine.ref)
          .reduce((acc, curr) => acc + getPoseSize(curr.pose), 0);
        return Math.ceil(-stock / poses);
      }
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

  private readonly handleDownload = (): void => {
    const {planProduction} = this.state;
    if (!planProduction) {
      return;
    }
    const {day, indexInDay} = planProduction;
    bridge.saveToPDF(`plan_prod_${computePlanProdRef(day, indexInDay)}.pdf`).catch(console.error);
  };

  private readonly handleClear = (): void => {
    bridge.clearPlan().catch(console.error);
  };

  private readonly handleSave = (): void => {
    const {planProduction, bobinesMinimums, reorderedEncriers, speed} = this.state;
    if (!planProduction) {
      return;
    }
    const {
      couleursEncrier,
      selectedBobines,
      selectedPapier,
      selectedPerfo,
      selectedPolypro,
      selectedRefente,
      day,
      indexInDay,
      tourCount,
    } = planProduction;

    if (
      selectedPolypro === undefined ||
      selectedPapier === undefined ||
      selectedPerfo === undefined ||
      selectedRefente === undefined ||
      tourCount === undefined
    ) {
      return;
    }

    const data: PlanProductionData = {
      day,
      indexInDay,
      isBeginningOfDay: false,

      polypro: selectedPolypro,
      papier: selectedPapier,
      perfo: selectedPerfo,
      refente: selectedRefente,
      bobines: selectedBobines,
      bobinesMini: Array.from(bobinesMinimums.entries()),
      encriers: reorderedEncriers || couleursEncrier[0],

      tourCount,
      speed,
      status: PlanProductionStatus.PLANNED,
    };

    const serializedData = JSON.stringify(data);
    bridge
      .savePlanProduction(undefined, serializedData)
      .then(() => bridge.closeApp())
      .catch(console.error);
  };

  private isComplete(): boolean {
    const {planProduction, speed} = this.state;
    if (!planProduction) {
      return false;
    }
    return (
      planProduction.tourCount !== undefined &&
      planProduction.tourCount > 0 &&
      speed > 0 &&
      planProduction.selectablePapiers.length === 0 &&
      planProduction.selectableBobines.length === 0 &&
      planProduction.selectablePerfos.length === 0 &&
      planProduction.selectablePolypros.length === 0 &&
      planProduction.selectableRefentes.length === 0
    );
  }

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

  private renderBobineMereContent(
    color: Color,
    pixelPerMM: number,
    bobine: BobineMere,
    isPolypro: boolean
  ): JSX.Element {
    const {stocks, planProduction} = this.state;
    const {ref, couleurPapier = '', laize = 0, longueur = 0, grammage = 0} = bobine;

    const grammageStr = `${grammage}${isPolypro ? 'g/m²' : 'g'}`;
    const longueurStr = `${numberWithSeparator(longueur)} m`;
    const stockReel = stocks ? getStockReel(ref, stocks) : 0;
    const stockTerme = stocks ? getStockTerme(ref, stocks) : 0;
    const tourCount = planProduction ? planProduction.tourCount || 0 : 0;
    const longueurBobineFille =
      planProduction && planProduction.selectedBobines.length > 0
        ? planProduction.selectedBobines[0].longueur || 0
        : 0;
    const withDecimal = (value: number): number => Math.round(value * 10) / 10;
    const prod = withDecimal(longueur !== 0 ? (tourCount * longueurBobineFille) / longueur : 0);

    const title = `${ref} ${couleurPapier} ${laize} ${grammageStr} - ${longueurStr}`;
    const stockActuel = `${stockReel} (à terme ${stockTerme})`;
    const stockPrevisionel = '? (à terme ?)';
    const stockAfterProd = `${withDecimal(stockReel - prod)} (à terme ${withDecimal(
      stockTerme - prod
    )})`;

    const large = theme.planProd.elementsBaseLargeFontSize * pixelPerMM;
    const medium = theme.planProd.elementsBaseMediumFontSize * pixelPerMM;
    const small = theme.planProd.elementsBaseSmallFontSize * pixelPerMM;
    const colorStyle = {color: color.textHex};

    return (
      <BobineMereContent>
        <AutoFontWeight style={colorStyle} fontSize={large}>
          <BobineMereContentTitle>{title}</BobineMereContentTitle>
        </AutoFontWeight>
        <BobineMereContentStocks>
          <BobineMereContentStock>
            <AutoFontWeight style={colorStyle} fontSize={small}>
              <BobineMereContentStockTitle>STOCK ACTUEL</BobineMereContentStockTitle>
            </AutoFontWeight>
            <AutoFontWeight style={colorStyle} fontSize={medium}>
              <BobineMereContentStockContent>{stockActuel}</BobineMereContentStockContent>
            </AutoFontWeight>
          </BobineMereContentStock>
          <BobineMereContentStock>
            <AutoFontWeight style={colorStyle} fontSize={small}>
              <BobineMereContentStockTitle>PRÉVISIONNEL</BobineMereContentStockTitle>
            </AutoFontWeight>
            <AutoFontWeight style={colorStyle} fontSize={medium}>
              <BobineMereContentStockContent>{stockPrevisionel}</BobineMereContentStockContent>
            </AutoFontWeight>
          </BobineMereContentStock>
          <BobineMereContentStock>
            <AutoFontWeight style={colorStyle} fontSize={small}>
              <BobineMereContentStockTitle>APRÈS PROD</BobineMereContentStockTitle>
            </AutoFontWeight>
            <AutoFontWeight style={colorStyle} fontSize={medium}>
              <BobineMereContentStockContent>{stockAfterProd}</BobineMereContentStockContent>
            </AutoFontWeight>
          </BobineMereContentStock>
        </BobineMereContentStocks>
      </BobineMereContent>
    );
  }

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
                    {this.renderBobineMereContent(color, pixelPerMM, selectedPapier, false)}
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
                    {this.renderBobineMereContent(color, pixelPerMM, selectedPolypro, true)}
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
                  showQuantity={!isPrinting}
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

          const planProdTitle = 'NOUVELLE PRODUCTION';

          return (
            <PlanProdEditorContainer>
              <TopBar
                width={adjustedWidthForPrinting}
                planProdTitle={planProdTitle}
                bobines={planProduction.selectedBobines}
                papier={planProduction.selectedPapier}
                tourCount={tourCount}
                speed={speed}
                onTourCountChange={this.handleTourCountChange}
                onSpeedChange={this.handleSpeedChange}
                onSave={this.handleSave}
                onDownload={this.handleDownload}
                onClear={this.handleClear}
                isComplete={this.isComplete()}
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

const BobineMereContent = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
`;
const BobineMereContentTitle = styled.div`
  text-align: center;
`;
const BobineMereContentStocks = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-evenly;
`;
const BobineMereContentStock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;
const BobineMereContentStockTitle = styled.div``;
const BobineMereContentStockContent = styled.div``;
