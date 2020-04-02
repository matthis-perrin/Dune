import React from 'react';

import {ProductionTable} from '@root/components/apps/plan_prod_editor/production_table';
import {Picker} from '@root/components/common/picker';
import {LoadingScreen} from '@root/components/core/loading_screen';
import {SizeMonitor} from '@root/components/core/size_monitor';
import {
  DESIGNATION_COLUMN,
  LAIZE_COLUMN,
  COULEUR_PAPIER_COLUMN,
  GRAMMAGE_COLUMN,
  STOCK_TERME_COLUMN,
  TYPE_IMPRESSION_COLUMN,
  MULTI_POSE_COLUMN,
  COULEURS_IMPRESSION_COLUMN,
  STOCK_STATE_COLUMN,
  LAST_YEAR_SELLING,
  QUANTITY_TO_PRODUCE,
  BOBINE_FILLE_REF_COLUMN,
  LONGUEUR_COLUMN,
  withWidth,
  MONTHLY_SELLING,
  STOCK_PREVISIONEL_COMPUTED_COLUMN,
} from '@root/components/table/columns';
import {SortableTable, ColumnMetadata} from '@root/components/table/sortable_table';
import {bridge} from '@root/lib/bridge';
import {asPlanProduction} from '@root/lib/plan_prod';
import {getStartForPlanIndex} from '@root/lib/schedule_utils';
import {bobinesQuantitiesStore} from '@root/stores/data_store';
import {
  bobinesFillesWithMultiPoseStore,
  stocksStore,
  cadencierStore,
} from '@root/stores/list_store';
import {ScheduleStore} from '@root/stores/schedule_store';
import {theme} from '@root/theme';

import {
  Stock,
  BobineFilleWithMultiPose,
  BobineQuantities,
  PlanProductionState,
  PlanProductionInfo,
  Schedule,
} from '@shared/models';

const DEFAULT_SPEED = 180;

// tslint:disable-next-line:no-any
type AnyColumns = ColumnMetadata<BobineFilleWithMultiPose & {start: number}, any>[];

interface Props {
  id: number;
  start: number;
  end: number;
}

interface State {
  stocks?: Map<string, Stock[]>;
  cadencier?: Map<string, Map<number, number>>;
  bobineQuantities?: BobineQuantities[];
  schedule?: Schedule;
}

export class BobinesPickerApp extends React.Component<Props, State> {
  public static displayName = 'BobinesPickerApp';
  private readonly scheduleStore: ScheduleStore;

  private lastStocks: Map<string, Stock[]> | undefined;
  private lastCadencier: Map<string, Map<number, number>> | undefined;
  private lastBobineQuantities: BobineQuantities[] | undefined;
  private readonly lastSchedule: Schedule | undefined;
  private lastPlanProd: PlanProductionState | undefined;
  private lastIsSelectionnable: ((element: BobineFilleWithMultiPose) => boolean) | undefined;

  private lastColumns: AnyColumns | undefined;
  private lastRowStyles: ((element: BobineFilleWithMultiPose) => React.CSSProperties) | undefined;

  constructor(props: Props) {
    super(props);
    this.state = {};
    const {start, end} = props;
    this.scheduleStore = new ScheduleStore({start, end});
  }

  public componentDidMount(): void {
    stocksStore.addListener(this.handleValuesChanged);
    cadencierStore.addListener(this.handleValuesChanged);
    bobinesQuantitiesStore.addListener(this.handleValuesChanged);
    this.scheduleStore.start(this.handleValuesChanged);
  }

  public componentWillUnmount(): void {
    stocksStore.removeListener(this.handleValuesChanged);
    cadencierStore.removeListener(this.handleValuesChanged);
    bobinesQuantitiesStore.removeListener(this.handleValuesChanged);
    this.scheduleStore.stop();
  }

  private readonly handleValuesChanged = (): void => {
    this.setState({
      stocks: stocksStore.getStockIndex(),
      cadencier: cadencierStore.getCadencierIndex(),
      bobineQuantities: bobinesQuantitiesStore.getData(),
      schedule: this.scheduleStore.getSchedule(),
    });
  };

  private getColumns(
    stocks: Map<string, Stock[]>,
    cadencier: Map<string, Map<number, number>>,
    bobineQuantities: BobineQuantities[],
    schedule: Schedule,
    planProd: PlanProductionState & PlanProductionInfo
  ): AnyColumns {
    if (
      this.lastColumns &&
      this.lastStocks === stocks &&
      this.lastCadencier === cadencier &&
      this.lastBobineQuantities === bobineQuantities &&
      this.lastSchedule === schedule &&
      this.lastPlanProd === planProd
    ) {
      return this.lastColumns;
    }

    this.lastStocks = stocks;
    this.lastCadencier = cadencier;
    this.lastBobineQuantities = bobineQuantities;
    this.lastPlanProd = planProd;
    this.lastColumns = [
      withWidth(BOBINE_FILLE_REF_COLUMN, undefined),
      LAIZE_COLUMN,
      LONGUEUR_COLUMN,
      COULEUR_PAPIER_COLUMN,
      GRAMMAGE_COLUMN,
      MULTI_POSE_COLUMN(this.props.id, stocks, cadencier, bobineQuantities, schedule, planProd),
      COULEURS_IMPRESSION_COLUMN,
      TYPE_IMPRESSION_COLUMN,
      QUANTITY_TO_PRODUCE(stocks, cadencier, bobineQuantities, schedule, planProd),
      LAST_YEAR_SELLING(cadencier),
      MONTHLY_SELLING(cadencier),
      STOCK_TERME_COLUMN(stocks),
      STOCK_PREVISIONEL_COMPUTED_COLUMN(stocks, schedule, planProd),
      STOCK_STATE_COLUMN(stocks, cadencier, bobineQuantities, schedule, planProd),
    ];
    return this.lastColumns;
  }

  private getRowStyles(
    isSelectionnable: (element: BobineFilleWithMultiPose) => boolean
  ): (element: BobineFilleWithMultiPose) => React.CSSProperties {
    if (this.lastRowStyles && this.lastIsSelectionnable === isSelectionnable) {
      return this.lastRowStyles;
    }
    this.lastIsSelectionnable = isSelectionnable;
    this.lastRowStyles = (bobine) => {
      const selectable = isSelectionnable(bobine);
      return {
        opacity: selectable ? 1 : theme.table.disabledOpacity,
      };
    };
    return this.lastRowStyles;
  }

  public render(): JSX.Element {
    const {id} = this.props;
    const {stocks, cadencier, bobineQuantities, schedule} = this.state;

    if (!stocks || !cadencier || !bobineQuantities || !schedule) {
      return <LoadingScreen />;
    }

    return (
      <SizeMonitor>
        {(width, height) => (
          <Picker<BobineFilleWithMultiPose>
            id={id}
            getHash={(r) => r.ref}
            getSelectable={(p) => p.selectableBobines}
            store={bobinesFillesWithMultiPoseStore}
            title="Choix des bobines"
            searchColumns={[BOBINE_FILLE_REF_COLUMN, DESIGNATION_COLUMN, COULEUR_PAPIER_COLUMN]}
          >
            {(elements, isSelectionnable, planProd, header, footer) => {
              const filterBarHeight = theme.table.footerHeight;
              const searchBarHeight = theme.table.searchBarHeight;
              const availableWidth = width;

              const planProduction = asPlanProduction(planProd, id, DEFAULT_SPEED);
              const emulatedSchedule =
                planProduction &&
                this.scheduleStore.emulateWithPlan(planProduction, planProd.index);

              const start = getStartForPlanIndex(emulatedSchedule || schedule, planProd.index);

              const columns = this.getColumns(
                stocks,
                cadencier,
                bobineQuantities,
                schedule,
                planProd
              );

              const selectedTableHeight =
                planProd.selectedBobines.length > 0
                  ? planProd.selectedBobines.length * theme.table.rowHeight + filterBarHeight
                  : 0;

              const selectableTableHeight =
                height - selectedTableHeight - filterBarHeight - searchBarHeight;

              const productionTable =
                planProd.selectedBobines.length > 0 && stocks && cadencier && bobineQuantities ? (
                  <ProductionTable
                    width={availableWidth}
                    planProduction={planProd}
                    stocks={stocks}
                    cadencier={cadencier}
                    bobineQuantities={bobineQuantities}
                    canRemove
                    onRemove={(ref: string) => {
                      bridge.removePlanBobine(id, ref).catch(console.error);
                    }}
                    showQuantity
                    schedule={emulatedSchedule || schedule}
                    planIndex={planProd.index}
                  />
                ) : (
                  <React.Fragment />
                );

              return (
                <React.Fragment>
                  {header}
                  {productionTable}
                  <SortableTable
                    width={availableWidth}
                    height={selectableTableHeight}
                    data={elements.map((e) => ({...e, start}))}
                    columns={columns}
                    initialSort={{
                      index: columns.length - 1,
                      asc: true,
                    }}
                    rowStyles={this.getRowStyles(isSelectionnable)}
                  />
                  {footer}
                </React.Fragment>
              );
            }}
          </Picker>
        )}
      </SizeMonitor>
    );
  }
}
