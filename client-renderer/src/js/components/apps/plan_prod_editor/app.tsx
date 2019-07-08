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
import {BobineMereContent} from '@root/components/common/bobine_mere_content';
import {Perfo as PerfoComponent} from '@root/components/common/perfo';
import {PlanProdComment} from '@root/components/common/plan_prod_comment';
import {Refente as RefenteComponent} from '@root/components/common/refente';
import {Closable} from '@root/components/core/closable';
import {LoadingScreen} from '@root/components/core/loading_screen';
import {SizeMonitor, SCROLLBAR_WIDTH} from '@root/components/core/size_monitor';
import {WithColor} from '@root/components/core/with_colors';
import {getBobineState} from '@root/lib/bobine';
import {bridge} from '@root/lib/bridge';
import {CAPACITE_MACHINE} from '@root/lib/constants';
import {getPlanProdTitle} from '@root/lib/plan_prod';
import {bobinesQuantitiesStore} from '@root/stores/data_store';
import {stocksStore, cadencierStore, plansProductionStore} from '@root/stores/list_store';
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
  PlanProductionInfo,
  PlanProduction,
} from '@shared/models';

const MAX_PLAN_PROD_WIDTH = 1050;
const INITIAL_SPEED = 180;
const ADJUSTED_WIDTH_WHEN_RENDERING_PDF = 1180;

interface Props {
  id: number;
}

interface State {
  planProduction?: PlanProductionState & PlanProductionInfo;
  reorderedBobines?: BobineFilleWithPose[];
  reorderedEncriers?: EncrierColor[];
  bobinesMinimums: Map<string, number>;
  bobinesMaximums: Map<string, number>;

  stocks?: Map<string, Stock[]>;
  cadencier?: Map<string, Map<number, number>>;
  bobineQuantities?: BobineQuantities[];
  plansProd?: PlanProduction[];

  tourCountSetByUser: boolean;
  speed: number;
  comment: string;
}

export class PlanProdEditorApp extends React.Component<Props, State> {
  public static displayName = 'PlanProdEditorApp';

  public constructor(props: Props) {
    super(props);
    this.state = {
      tourCountSetByUser: false,
      speed: INITIAL_SPEED,
      bobinesMinimums: new Map<string, number>(),
      bobinesMaximums: new Map<string, number>(),
      comment: '',
    };
  }

  public componentDidMount(): void {
    bridge.addEventListener(PlanProductionChanged, this.refreshPlanProduction);
    stocksStore.addListener(this.handleStoresChanged);
    cadencierStore.addListener(this.handleStoresChanged);
    bobinesQuantitiesStore.addListener(this.handleStoresChanged);
    plansProductionStore.addListener(this.handleStoresChanged);
    this.refreshPlanProduction();
  }

  public componentWillUnmount(): void {
    bridge.removeEventListener(PlanProductionChanged, this.refreshPlanProduction);
    stocksStore.removeListener(this.handleStoresChanged);
    cadencierStore.removeListener(this.handleStoresChanged);
    bobinesQuantitiesStore.removeListener(this.handleStoresChanged);
    plansProductionStore.removeListener(this.handleStoresChanged);
  }

  private readonly handleStoresChanged = (): void => {
    this.setState({
      stocks: stocksStore.getStockIndex(),
      cadencier: cadencierStore.getCadencierIndex(),
      bobineQuantities: bobinesQuantitiesStore.getData(),
      plansProd: plansProductionStore.getActivePlansProd(),
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

  private readonly handleMaxUpdated = (ref: string, newMax: number): void => {
    const currentBobinesMaximums = Array.from(this.state.bobinesMaximums.entries());
    const newBobinesMaximums = new Map<string, number>(currentBobinesMaximums);
    newBobinesMaximums.set(ref, newMax);
    this.setState({bobinesMaximums: newBobinesMaximums});
  };

  private readonly handleSpeedChange = (speed: number): void => {
    this.setState({speed});
  };

  private readonly handleDownload = (): void => {
    const {planProduction} = this.state;
    if (!planProduction) {
      return;
    }
    const {year, month, day, indexInDay} = planProduction;
    bridge.saveToPDF(`plan_prod_${year}_${month}_${day}_${indexInDay}.pdf`).catch(console.error);
  };

  private readonly handleClear = (): void => {
    bridge.clearPlan().catch(console.error);
  };

  private readonly handleSave = (): void => {
    const {
      planProduction,
      bobinesMinimums,
      bobinesMaximums,
      reorderedEncriers,
      reorderedBobines,
      speed,
      comment,
    } = this.state;
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
      year,
      month,
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
      isBeginningOfDay: false,

      polypro: selectedPolypro,
      papier: selectedPapier,
      perfo: selectedPerfo,
      refente: selectedRefente,
      bobines: reorderedBobines || selectedBobines,
      bobinesMini: Array.from(bobinesMinimums.entries()),
      bobinesMax: Array.from(bobinesMaximums.entries()),
      encriers: reorderedEncriers || couleursEncrier[0],

      tourCount,
      speed,
      comment,
      status: PlanProductionStatus.PLANNED,
    };

    const serializedData = JSON.stringify(data);
    bridge
      .savePlanProduction(undefined, year, month, day, indexInDay, serializedData)
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

  public render(): JSX.Element {
    const {id} = this.props;
    const {
      planProduction,
      reorderedBobines,
      reorderedEncriers,
      stocks,
      cadencier,
      bobineQuantities,
      plansProd,
      speed,
      bobinesMinimums,
      bobinesMaximums,
      comment,
    } = this.state;

    if (!planProduction || !stocks || !plansProd) {
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
                    <BobineMereContent
                      color={color}
                      pixelPerMM={pixelPerMM}
                      bobine={selectedPapier}
                      isPolypro={false}
                      stocks={stocks}
                      plansProd={plansProd}
                      info={planProduction}
                      tourCount={tourCount}
                      selectedBobines={selectedBobines}
                    />
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
                    <BobineMereContent
                      color={color}
                      pixelPerMM={pixelPerMM}
                      bobine={selectedPolypro}
                      isPolypro
                      stocks={stocks}
                      plansProd={plansProd}
                      info={planProduction}
                      tourCount={tourCount}
                      selectedBobines={selectedBobines}
                    />
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
            planProduction.selectedBobines.length > 0 && cadencier && bobineQuantities ? (
              <React.Fragment>
                {padding}
                <ProductionTable
                  width={adjustedAvailableWidth}
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
                  maximums={bobinesMaximums}
                  onMiniUpdated={this.handleMiniUpdated}
                  onMaxUpdated={this.handleMaxUpdated}
                />
              </React.Fragment>
            ) : (
              <React.Fragment />
            );

          const planProdTitle = getPlanProdTitle(id);

          return (
            <PlanProdEditorContainer>
              <TopBar
                width={adjustedWidthForPrinting}
                planProdTitle={planProdTitle}
                bobines={planProduction.selectedBobines}
                papier={planProduction.selectedPapier}
                polypro={planProduction.selectedPolypro}
                tourCount={tourCount}
                speed={speed}
                onTourCountChange={this.handleTourCountChange}
                onSpeedChange={this.handleSpeedChange}
                onSave={this.handleSave}
                onDownload={this.handleDownload}
                onClear={this.handleClear}
                isComplete={this.isComplete()}
                isPrinting={isPrinting}
                stocks={stocks}
              />
              <Wrapper style={{width: adjustedAvailableWidth + leftPadding}}>
                <PlanProdComment
                  padding={padding}
                  comment={comment}
                  width={adjustedAvailableWidth}
                  isPrinting={isPrinting}
                  onChange={event => this.setState({comment: event.target.value})}
                />
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
