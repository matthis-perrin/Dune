import * as React from 'react';

import {Picker} from '@root/components/common/picker';
import {SizeMonitor} from '@root/components/core/size_monitor';
import {
  DESIGNATION_COLUMN,
  LAIZE_COLUMN,
  LONGUEUR_COLUMN,
  COULEUR_PAPIER_COLUMN,
  GRAMMAGE_COLUMN,
  STOCK_COLUMN,
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

export class PapierPickerApp extends React.Component<Props, State> {
  public static displayName = 'PapierPickerApp';

  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  private readonly handlePapierSelected = (bobineMere: BobineMere) => {
    bridge
      .setPlanPapier(bobineMere.ref)
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
      LONGUEUR_COLUMN,
      COULEUR_PAPIER_COLUMN,
      GRAMMAGE_COLUMN,
      STOCK_COLUMN(this.state.stocks || new Map<string, Stock[]>()),
      LAST_UPDATE_COLUMN,
    ];
    return (
      <Picker<BobineMere>
        getHash={r => r.ref}
        getSelectable={p => p.selectablePapiers}
        store={bobinesMeresStore}
        title="Choix du papier"
        dataFilter={p => p.couleurPapier !== 'POLYPRO'}
        searchColumns={columns}
      >
        {(elements, isSelectionnable, planProd, header, footer) => (
          <SizeMonitor>
            {(width, height) => {
              const availableWidth = width;
              const availableHeight =
                height - theme.table.headerHeight - theme.table.searchBarHeight;
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
                    onRowClick={this.handlePapierSelected}
                    rowStyles={papier => ({
                      opacity: isSelectionnable(papier) ? 1 : theme.table.disabledOpacity,
                      pointerEvents: isSelectionnable(papier) ? 'all' : 'none',
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
