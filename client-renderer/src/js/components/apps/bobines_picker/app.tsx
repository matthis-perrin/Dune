import * as React from 'react';

import {ProductionTable} from '@root/components/apps/plan_prod_editor/production_table';
import {Picker} from '@root/components/common/picker';
import {LoadingScreen} from '@root/components/core/loading_screen';
import {SizeMonitor} from '@root/components/core/size_monitor';
import {
  DESIGNATION_COLUMN,
  LAIZE_COLUMN,
  COULEUR_PAPIER_COLUMN,
  GRAMMAGE_COLUMN,
  STOCK_COLUMN,
  TYPE_IMPRESSION_COLUMN,
  MULTI_POSE_COLUMN,
  COULEURS_IMPRESSION_COLUMN,
  STOCK_STATE_COLUMN,
  LAST_YEAR_SELLING,
  QUANTITY_TO_PRODUCE,
  BOBINE_FILLE_REF_COLUMN,
} from '@root/components/table/columns';
import {SortableTable} from '@root/components/table/sortable_table';
import {bridge} from '@root/lib/bridge';
import {bobinesQuantitiesStore} from '@root/stores/data_store';
import {
  bobinesFillesWithMultiPoseStore,
  stocksStore,
  cadencierStore,
} from '@root/stores/list_store';
import {theme} from '@root/theme';

import {Stock, BobineFilleWithMultiPose, BobineQuantities} from '@shared/models';

interface Props {}

interface State {
  stocks?: Map<string, Stock[]>;
  cadencier?: Map<string, Map<number, number>>;
  bobineQuantities?: BobineQuantities[];
}

export class BobinesPickerApp extends React.Component<Props, State> {
  public static displayName = 'BobinesPickerApp';

  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  public componentDidMount(): void {
    stocksStore.addListener(this.handleValuesChanged);
    cadencierStore.addListener(this.handleValuesChanged);
    bobinesQuantitiesStore.addListener(this.handleValuesChanged);
  }

  public componentWillUnmount(): void {
    stocksStore.removeListener(this.handleValuesChanged);
    cadencierStore.removeListener(this.handleValuesChanged);
    bobinesQuantitiesStore.removeListener(this.handleValuesChanged);
  }

  private readonly handleValuesChanged = (): void => {
    this.setState({
      stocks: stocksStore.getStockIndex(),
      cadencier: cadencierStore.getCadencierIndex(),
      bobineQuantities: bobinesQuantitiesStore.getData(),
    });
  };

  public render(): JSX.Element {
    const {stocks, cadencier, bobineQuantities} = this.state;

    if (!stocks || !cadencier || !bobineQuantities) {
      return <LoadingScreen />;
    }

    return (
      <SizeMonitor>
        {(width, height) => (
          <Picker<BobineFilleWithMultiPose>
            getHash={r => r.ref}
            getSelectable={p => p.selectableBobines}
            store={bobinesFillesWithMultiPoseStore}
            title="Choix des bobines"
            searchColumns={[BOBINE_FILLE_REF_COLUMN, DESIGNATION_COLUMN, COULEUR_PAPIER_COLUMN]}
          >
            {(elements, isSelectionnable, planProd, header, footer) => {
              const filterBarHeight = theme.table.footerHeight;
              const searchBarHeight = theme.table.searchBarHeight;
              const availableWidth = width;

              const columns = [
                BOBINE_FILLE_REF_COLUMN,
                DESIGNATION_COLUMN,
                LAIZE_COLUMN,
                COULEUR_PAPIER_COLUMN,
                GRAMMAGE_COLUMN,
                MULTI_POSE_COLUMN(stocks, cadencier, bobineQuantities, planProd),
                COULEURS_IMPRESSION_COLUMN,
                TYPE_IMPRESSION_COLUMN,
                QUANTITY_TO_PRODUCE(stocks, cadencier, bobineQuantities),
                LAST_YEAR_SELLING(cadencier),
                STOCK_COLUMN(stocks),
                STOCK_STATE_COLUMN(stocks, cadencier, bobineQuantities),
              ];

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
                    onRemove={(ref: string) => {
                      bridge.removePlanBobine(ref).catch(console.error);
                    }}
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
                    data={elements}
                    columns={columns}
                    initialSort={{
                      index: columns.length - 1,
                      asc: true,
                    }}
                    rowStyles={bobine => ({
                      opacity: isSelectionnable(bobine) ? 1 : theme.table.disabledOpacity,
                    })}
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
