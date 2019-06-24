import * as React from 'react';
import styled from 'styled-components';

import {LoadingTable} from '@root/components/apps/main/administration/admin_table';
import {Picker} from '@root/components/common/picker';
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
  BOBINE_FILLE_REF,
  STOCK_STATE_COLUMN,
  LAST_YEAR_SELLING,
} from '@root/components/table/columns';
import {FastTable} from '@root/components/table/fast_table';
import {SortableTable} from '@root/components/table/sortable_table';
import {bobinesQuantitiesStore} from '@root/stores/data_store';
import {
  bobinesFillesWithMultiPoseStore,
  stocksStore,
  cadencierStore,
} from '@root/stores/list_store';
import {theme} from '@root/theme';

import {Stock, BobineFilleWithMultiPose, BobineQuantities} from '@shared/models';
import {removeUndefined} from '@shared/type_utils';

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
      return <LoadingTable />;
    }

    return (
      <SizeMonitor>
        {(width, height) => (
          <Picker<BobineFilleWithMultiPose>
            getHash={r => r.ref}
            getSelectable={p => p.selectableBobines}
            store={bobinesFillesWithMultiPoseStore}
            title="Choix des bobines"
            searchColumns={[BOBINE_FILLE_REF, DESIGNATION_COLUMN, COULEUR_PAPIER_COLUMN]}
          >
            {(elements, isSelectionnable, planProd, header, footer) => {
              const filterBarHeight = 32;
              const searchBarHeight = 32;
              const availableWidth = width;

              const columns = [
                BOBINE_FILLE_REF,
                DESIGNATION_COLUMN,
                LAIZE_COLUMN,
                COULEUR_PAPIER_COLUMN,
                GRAMMAGE_COLUMN,
                MULTI_POSE_COLUMN(stocks, cadencier, bobineQuantities, planProd),
                COULEURS_IMPRESSION_COLUMN,
                TYPE_IMPRESSION_COLUMN,
                LAST_YEAR_SELLING(cadencier),
                STOCK_COLUMN(stocks),
                STOCK_STATE_COLUMN(stocks, cadencier, bobineQuantities),
              ];

              const selectableMap = new Map<string, BobineFilleWithMultiPose>();
              elements.forEach(b => selectableMap.set(b.ref, b));

              const bobinesFillesWithMultiPoseMap = new Map<string, BobineFilleWithMultiPose>();
              const allSelectedBobinesWithMultiPoses = bobinesFillesWithMultiPoseStore.getData();
              if (allSelectedBobinesWithMultiPoses) {
                allSelectedBobinesWithMultiPoses.forEach(b =>
                  bobinesFillesWithMultiPoseMap.set(b.ref, b)
                );
              }
              const selectedBobinesWithMultiPoses = removeUndefined(
                planProd.selectedBobines
                  .map(b => b.ref)
                  .reduce(
                    (acc, curr) => (acc.indexOf(curr) === -1 ? acc.concat([curr]) : acc),
                    [] as string[]
                  )
                  .map(ref => bobinesFillesWithMultiPoseMap.get(ref))
              ).map(b => {
                const selectable = selectableMap.get(b.ref);
                const availablePoses = selectable ? [...selectable.availablePoses] : [];
                return {...b, availablePoses};
              });

              const selectedTableHeight =
                selectedBobinesWithMultiPoses.length > 0
                  ? selectedBobinesWithMultiPoses.length * theme.table.rowHeight + filterBarHeight
                  : 0;

              const selectableTableHeight =
                height - selectedTableHeight - filterBarHeight - searchBarHeight;

              const selectedTable =
                selectedBobinesWithMultiPoses.length > 0 ? (
                  <React.Fragment>
                    <SelectedTableHeader>BOBINES SÉLECTIONNÉES</SelectedTableHeader>
                    <FastTable<BobineFilleWithMultiPose>
                      width={width}
                      height={selectedTableHeight - filterBarHeight}
                      rowHeight={theme.table.rowHeight}
                      columns={columns}
                      data={selectedBobinesWithMultiPoses}
                    />
                  </React.Fragment>
                ) : (
                  <React.Fragment />
                );

              console.log('render in bobine picker');

              return (
                <React.Fragment>
                  {header}
                  {selectedTable}
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
                      opacity: isSelectionnable(bobine) ? 1 : 0.5,
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

const SelectedTableHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: ${theme.table.headerHeight}px;
  line-height: ${theme.table.headerHeight}px;
  color: ${theme.table.headerColor};
  font-size: ${theme.table.headerFontSize}px;
  font-weight: ${theme.table.headerFontWeight};
  user-select: none;
  width: 100%;
  background-color: ${theme.table.headerBackgroundColor};
`;
