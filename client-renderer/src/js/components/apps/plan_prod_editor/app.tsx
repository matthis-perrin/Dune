import {isEqual} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {BobinesForm} from '@root/components/apps/plan_prod_editor/bobines_form';
import {OperationTable} from '@root/components/apps/plan_prod_editor/operations_table';
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
import {
  getPlanProdTitle,
  PLAN_PROD_NUMBER_DIGIT_COUNT,
  asPlanProduction,
} from '@root/lib/plan_prod';
import {getPreviousSchedule, getStartForPlanIndex} from '@root/lib/schedule_utils';
import {bobinesQuantitiesStore, operationsStore, constantsStore} from '@root/stores/data_store';
import {stocksStore, cadencierStore} from '@root/stores/list_store';
import {ScheduleStore} from '@root/stores/schedule_store';
import {theme} from '@root/theme';

import {PlanProductionChanged} from '@shared/bridge/commands';
import {getPoseSize} from '@shared/lib/cliches';
import {EncrierColor} from '@shared/lib/encrier';
import {padNumber} from '@shared/lib/utils';
import {
  PlanProductionState,
  ClientAppType,
  BobineFilleWithPose,
  BobineState,
  Stock,
  BobineQuantities,
  PlanProductionData,
  PlanProductionInfo,
  Operation,
  Schedule,
  Constants,
} from '@shared/models';
import {asMap, asNumber} from '@shared/type_utils';

const MAX_PLAN_PROD_WIDTH = 1050;
const ADJUSTED_WIDTH_WHEN_RENDERING_PDF = 1180;

interface Props {
  id: number;
  start: number;
  end: number;
  isCreating: boolean;
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
  schedule?: Schedule;
  operations?: Operation[];
  constants?: Constants;

  tourCountSetByUser: boolean;
  speed: number;
  comment: string;
}

export class PlanProdEditorApp extends React.Component<Props, State> {
  public static displayName = 'PlanProdEditorApp';
  private readonly scheduleStore: ScheduleStore;

  public constructor(props: Props) {
    super(props);
    this.state = {
      tourCountSetByUser: false,
      speed: 0,
      bobinesMinimums: new Map<string, number>(),
      bobinesMaximums: new Map<string, number>(),
      comment: '',
    };
    const {start, end} = props;
    this.scheduleStore = new ScheduleStore({start, end});
  }

  public componentDidMount(): void {
    bridge.addEventListener(PlanProductionChanged, this.handlePlanProductionChangedEvent);
    stocksStore.addListener(this.handleStoresChanged);
    cadencierStore.addListener(this.handleStoresChanged);
    bobinesQuantitiesStore.addListener(this.handleStoresChanged);
    operationsStore.addListener(this.handleStoresChanged);
    constantsStore.addListener(this.handleStoresChanged);
    this.scheduleStore.start(this.handleScheduleChange);
    this.refreshPlanProduction(true);
  }

  public componentWillUnmount(): void {
    bridge.removeEventListener(PlanProductionChanged, this.handlePlanProductionChangedEvent);
    stocksStore.removeListener(this.handleStoresChanged);
    cadencierStore.removeListener(this.handleStoresChanged);
    bobinesQuantitiesStore.removeListener(this.handleStoresChanged);
    operationsStore.removeListener(this.handleStoresChanged);
    constantsStore.removeListener(this.handleStoresChanged);
    this.scheduleStore.stop();
  }

  // tslint:disable-next-line:no-any
  private readonly handlePlanProductionChangedEvent = (data: any): void => {
    const id = asNumber(asMap(data).id, 0);
    if (id === this.props.id) {
      this.refreshPlanProduction(false);
    }
  };

  private readonly handleStoresChanged = (): void => {
    const constants = constantsStore.getData();
    let speed = this.state.speed;
    if (speed === 0 && constants !== undefined) {
      speed = constants[0].maxSpeed;
    }
    this.setState({
      stocks: stocksStore.getStockIndex(),
      cadencier: cadencierStore.getCadencierIndex(),
      bobineQuantities: bobinesQuantitiesStore.getData(),
      operations: operationsStore.getData(),
      constants: constants && constants[0],
    });
  };

  private readonly handleScheduleChange = (): void => {
    this.setState({
      schedule: this.scheduleStore.getSchedule(),
    });
  };

  private computeTourCount(newPlanProduction: PlanProductionState): number | undefined {
    const {schedule, planProduction} = this.state;
    const {tourCount, selectedBobines} = newPlanProduction;
    if (tourCount !== undefined && this.state.tourCountSetByUser) {
      return tourCount;
    }
    const {stocks, cadencier, bobineQuantities} = this.state;
    if (!stocks || !cadencier || !bobineQuantities || !schedule || !planProduction) {
      return tourCount;
    }
    const start = getStartForPlanIndex(schedule, planProduction.index);
    for (const bobine of selectedBobines) {
      const {state, quantity, stock} = getBobineState(
        bobine.ref,
        stocks,
        cadencier,
        bobineQuantities,
        0,
        schedule,
        start
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

  private readonly refreshPlanProduction = (initialLoad: boolean) => {
    const {id, isCreating} = this.props;
    document.title = getPlanProdTitle(id);
    if (!isCreating && initialLoad) {
      Promise.all([bridge.getPlanProductionEngineInfo(id), bridge.getPlanProduction(id)])
        .then(([planProductionEngineInfo, planProduction]) => {
          const newState = {
            ...this.state,
            planProduction: planProductionEngineInfo,
            reorderedBobines: planProduction.data.bobines,
            reorderedEncriers: planProduction.data.encriers,
            bobinesMinimums: new Map<string, number>(planProduction.data.bobinesMini),
            bobinesMaximums: new Map<string, number>(planProduction.data.bobinesMax),
            tourCountSetByUser: true,
            speed: planProduction.data.speed,
            comment: planProduction.data.comment,
          };
          this.setState(newState);
        })
        .catch(err => console.error(err));
    } else {
      bridge
        .getPlanProductionEngineInfo(id)
        .then(planProductionEngineInfo => {
          const newState = {
            ...this.state,
            planProduction: planProductionEngineInfo,
          };
          if (
            this.state.planProduction &&
            (this.state.reorderedBobines || this.state.reorderedEncriers) &&
            !isEqual(
              planProductionEngineInfo.selectedBobines,
              this.state.planProduction.selectedBobines
            )
          ) {
            newState.reorderedBobines = undefined;
            newState.reorderedEncriers = undefined;
          }
          this.setState(newState, () => {
            if (newState.planProduction) {
              const newTourCount = this.computeTourCount(newState.planProduction);
              if (newTourCount !== newState.planProduction.tourCount) {
                bridge.setPlanTourCount(id, newTourCount).catch(console.error);
              }
            }
          });
          if (planProductionEngineInfo.selectableBobines.length === 0) {
            bridge.closeAppOfType(ClientAppType.BobinesPickerApp).catch(console.error);
          }
        })
        .catch(err => console.error(err));
    }
  };

  private readonly handleBobineReorder = (newBobines: BobineFilleWithPose[]): void => {
    this.setState({reorderedBobines: newBobines});
  };

  private readonly handleEncrierReorder = (newEncriers: EncrierColor[]): void => {
    this.setState({reorderedEncriers: newEncriers});
  };

  private readonly handleTourCountChange = (newTourCount?: number): void => {
    const {id} = this.props;
    this.setState({tourCountSetByUser: true});
    bridge.setPlanTourCount(id, newTourCount).catch(console.error);
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
    const {id} = this.props;
    bridge
      .saveToPDF(`plan_prod_${padNumber(id, PLAN_PROD_NUMBER_DIGIT_COUNT)}.pdf`)
      .catch(console.error);
  };

  private readonly handleClear = (): void => {
    const {id} = this.props;
    bridge.clearPlan(id).catch(console.error);
  };

  private readonly handleSave = (): void => {
    const {id, isCreating} = this.props;
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
      index,
      operationAtStartOfDay,
      productionAtStartOfDay,
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
    };

    const serializedData = JSON.stringify(data);
    if (isCreating) {
      bridge
        .saveNewPlanProduction(
          id,
          index,
          operationAtStartOfDay,
          productionAtStartOfDay,
          serializedData
        )
        .then(() => bridge.closeApp())
        .catch(console.error);
    } else {
      bridge
        .updatePlanProduction(id, data)
        .then(() => bridge.closeApp())
        .catch(console.error);
    }
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

  private readonly removeRefente = (): void => {
    bridge.setPlanRefente(this.props.id, undefined).catch(console.error);
  };

  private readonly removePerfo = (): void => {
    bridge.setPlanPerfo(this.props.id, undefined).catch(console.error);
  };

  private readonly removePapier = (): void => {
    bridge.setPlanPapier(this.props.id, undefined).catch(console.error);
  };

  private readonly removePolypro = (): void => {
    bridge.setPlanPolypro(this.props.id, undefined).catch(console.error);
  };

  public render(): JSX.Element {
    const {id, start, end} = this.props;
    const {
      planProduction,
      reorderedBobines,
      reorderedEncriers,
      stocks,
      cadencier,
      bobineQuantities,
      schedule,
      operations,
      speed,
      bobinesMinimums,
      bobinesMaximums,
      comment,
    } = this.state;

    if (!planProduction || !stocks || !schedule || !operations) {
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
              planId={id}
              start={start}
              end={end}
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
            <SelectRefenteButton id={id} selectable={selectableRefentes} pixelPerMM={pixelPerMM} />
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
                      planIndex={planProduction.index}
                      schedule={emulatedSchedule || schedule}
                      tourCount={tourCount}
                      selectedBobines={selectedBobines}
                    />
                  </Bobine>
                </Closable>
              )}
            </WithColor>
          ) : (
            <SelectPapierButton
              id={id}
              start={start}
              end={end}
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
            <SelectPerfoButton id={id} selectable={selectablePerfos} pixelPerMM={pixelPerMM} />
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
                      planIndex={planProduction.index}
                      schedule={emulatedSchedule || schedule}
                      tourCount={tourCount}
                      selectedBobines={selectedBobines}
                    />
                  </Bobine>
                </Closable>
              )}
            </WithColor>
          ) : (
            <SelectPolyproButton
              id={id}
              start={start}
              end={end}
              selectedRefente={selectedRefente}
              selectable={selectablePolypros}
              pixelPerMM={pixelPerMM}
            />
          );

          const padding = <div style={{height: theme.planProd.basePadding * pixelPerMM}} />;
          const halfPadding = (
            <div style={{height: (theme.planProd.basePadding * pixelPerMM) / 2}} />
          );
          const planProd = asPlanProduction(planProduction, id, speed);
          const emulatedSchedule =
            planProd && this.scheduleStore.emulateWithPlan(planProd, planProduction.index);

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
                    bridge.removePlanBobine(id, ref).catch(console.error);
                  }}
                  minimums={bobinesMinimums}
                  maximums={bobinesMaximums}
                  onMiniUpdated={this.handleMiniUpdated}
                  onMaxUpdated={this.handleMaxUpdated}
                  planIndex={planProduction.index}
                  schedule={emulatedSchedule || schedule}
                />
              </React.Fragment>
            ) : (
              <React.Fragment />
            );

          let operationTable = <React.Fragment />;
          const previousSchedule = getPreviousSchedule(schedule, planProduction.index);

          if (
            selectedPapier &&
            selectedPolypro &&
            selectedPerfo &&
            selectedRefente &&
            previousSchedule &&
            operations
          ) {
            const planProdLight = {
              papier: selectedPapier,
              polypro: selectedPolypro,
              refente: selectedRefente,
              perfo: selectedPerfo,
              bobines: reorderedBobines || selectedBobines,
              encriers: reorderedEncriers || couleursEncrier[0],
            };
            operationTable = (
              <React.Fragment>
                <OperationTable
                  width={adjustedAvailableWidth}
                  planProduction={planProdLight}
                  previousSchedule={previousSchedule}
                  operations={operations}
                />
                {padding}
              </React.Fragment>
            );
          }

          const planProdTitle = getPlanProdTitle(id);

          return (
            <PlanProdEditorContainer>
              <TopBar
                width={adjustedWidthForPrinting}
                planProdTitle={planProdTitle}
                bobines={selectedBobines}
                papier={selectedPapier}
                polypro={selectedPolypro}
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
                schedule={emulatedSchedule || schedule}
                planIndex={planProduction.index}
                planId={id}
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
                {operationTable}
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
