import * as React from 'react';

import {Picker} from '@root/components/common/picker';
import {SizeMonitor} from '@root/components/core/size_monitor';
import {
  DESIGNATION_COLUMN,
  LAIZE_COLUMN,
  COULEUR_PAPIER_COLUMN,
  GRAMMAGE_COLUMN,
  STOCK_TERME_COLUMN,
  LAST_UPDATE_COLUMN,
  BOBINE_MERE_REF_COLUMN,
} from '@root/components/table/columns';
import {SortableTable} from '@root/components/table/sortable_table';
import {bridge} from '@root/lib/bridge';
import {bobinesMeresStore, stocksStore} from '@root/stores/list_store';
import {theme} from '@root/theme';

import {BobineMere, Stock} from '@shared/models';

interface Props {}

interface State {
  stocks?: Map<string, Stock[]>;
}

export class PolyproPickerApp extends React.Component<Props, State> {
  public static displayName = 'PolyproPickerApp';

  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  private readonly handlePolyproSelected = (bobineMere: BobineMere) => {
    bridge
      .setPlanPolypro(bobineMere.ref)
      .then(() => {
        bridge.closeApp().catch(console.error);
      })
      .catch(console.error);
  };

  public componentDidMount(): void {
    stocksStore.addListener(this.handleValuesChanged);
  }

  public componentWillUnmount(): void {
    stocksStore.removeListener(this.handleValuesChanged);
  }

  private readonly handleValuesChanged = (): void => {
    this.setState({stocks: stocksStore.getStockIndex()});
  };

  public render(): JSX.Element {
    const columns = [
      BOBINE_MERE_REF_COLUMN,
      DESIGNATION_COLUMN,
      LAIZE_COLUMN,
      COULEUR_PAPIER_COLUMN,
      GRAMMAGE_COLUMN,
      STOCK_TERME_COLUMN(this.state.stocks || new Map<string, Stock[]>()),
      LAST_UPDATE_COLUMN,
    ];
    return (
      <Picker<BobineMere>
        getHash={r => r.ref}
        getSelectable={p => p.selectablePolypros}
        store={bobinesMeresStore}
        title="Choix du polypro"
        dataFilter={p => p.couleurPapier === 'POLYPRO'}
        searchColumns={columns}
      >
        {(elements, isSelectionnable, planProd, header, footer) => (
          <SizeMonitor>
            {(width, height) => {
              const filterBarHeight = theme.table.footerHeight;
              const searchBarHeight = theme.table.searchBarHeight;
              const availableWidth = width;
              const availableHeight = height - filterBarHeight - searchBarHeight;
              return (
                <React.Fragment>
                  {header}
                  <SortableTable
                    width={availableWidth}
                    height={availableHeight}
                    data={elements}
                    columns={columns}
                    initialSort={{
                      index: 0,
                      asc: true,
                    }}
                    onRowClick={this.handlePolyproSelected}
                    rowStyles={polypro => ({
                      opacity: isSelectionnable(polypro) ? 1 : theme.table.disabledOpacity,
                      pointerEvents: isSelectionnable(polypro) ? 'all' : 'none',
                    })}
                  />
                  {footer}
                </React.Fragment>
              );
            }}
          </SizeMonitor>
        )}
      </Picker>
    );
  }
}
