import * as React from 'react';

import {Picker} from '@root/components/common/picker';
import {SizeMonitor} from '@root/components/core/size_monitor';
import {
  REFERENCE_COLUMN,
  DESIGNATION_COLUMN,
  LAIZE_COLUMN,
  LONGUEUR_COLUMN,
  COULEUR_PAPIER_COLUMN,
  GRAMMAGE_COLUMN,
  STOCK_COLUMN,
  LAST_UPDATE_COLUMN,
} from '@root/components/table/columns';
import {SortableTable} from '@root/components/table/sortable_table';
import {bridge} from '@root/lib/bridge';
import {bobinesMeresStore, stocksStore} from '@root/stores/list_store';
import {theme} from '@root/theme/default';

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
    return (
      <Picker<BobineMere>
        getHash={r => r.ref}
        getSelectable={p => p.selectablePolypros}
        store={bobinesMeresStore}
        title="Choix du polypro"
        dataFilter={p => p.couleurPapier === 'POLYPRO'}
      >
        {(elements, isSelectionnable) => (
          <SizeMonitor>
            {(width, height) => {
              const filterBarHeight = 32;
              const availableWidth = width;
              const availableHeight = height - filterBarHeight;
              // const pixelPerMM = availableWidth / CAPACITE_MACHINE;
              return (
                <SortableTable
                  width={availableWidth}
                  height={availableHeight}
                  data={elements}
                  lastUpdate={0}
                  columns={[
                    REFERENCE_COLUMN(170),
                    DESIGNATION_COLUMN,
                    LAIZE_COLUMN,
                    LONGUEUR_COLUMN,
                    COULEUR_PAPIER_COLUMN,
                    GRAMMAGE_COLUMN,
                    STOCK_COLUMN(this.state.stocks || new Map<string, Stock[]>()),
                    LAST_UPDATE_COLUMN,
                  ]}
                  initialSort={{
                    index: 0,
                    asc: true,
                  }}
                  onRowClick={this.handlePolyproSelected}
                  rowStyles={polypro => ({
                    opacity: isSelectionnable(polypro) ? 1 : 0.5,
                    pointerEvents: isSelectionnable(polypro) ? 'all' : 'none',
                  })}
                />

                // <div style={{width}}>

                //   {elements.map(polypro => {
                //     const enabled = isSelectionnable(polypro);
                //     return (
                //       <div
                //         onClick={() => this.handlePolyproSelected(polypro)}
                //       >{`${pixelPerMM} / ${enabled} / ${JSON.stringify(polypro)}`}</div>
                //     );
                //   })}
                // </div>
              );
            }}
          </SizeMonitor>
        )}
      </Picker>
    );
  }
}
