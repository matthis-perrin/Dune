import * as React from 'react';
import styled from 'styled-components';

import {Picker} from '@root/components/common/picker';
import {SizeMonitor} from '@root/components/core/size_monitor';
import {
  REFERENCE_COLUMN,
  DESIGNATION_COLUMN,
  LAIZE_COLUMN,
  COULEUR_PAPIER_COLUMN,
  GRAMMAGE_COLUMN,
  STOCK_COLUMN,
  LAST_UPDATE_COLUMN,
  IMPORTANCE_ORDRE_COULEUR_COLUMN,
  TYPE_IMPRESSION_COLUMN,
  MULTI_POSE_COLUMN,
} from '@root/components/table/columns';
import {SortableTable} from '@root/components/table/sortable_table';
// import {bridge} from '@root/lib/bridge';
import {bobinesFillesWithMultiPoseStore, stocksStore} from '@root/stores/list_store';

import {Stock, BobineFilleWithMultiPose} from '@shared/models';

interface Props {}

interface State {
  stocks?: Map<string, Stock[]>;
}

export class BobinesPickerApp extends React.Component<Props, State> {
  public static displayName = 'BobinesPickerApp';

  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  private readonly handleBobinesSelected = (bobineWithMultiPose: BobineFilleWithMultiPose) => {
    console.log(bobineWithMultiPose);
    // bridge.addPlanBobine(bobineWithPose.ref, bobineWithPose.pose).catch(console.error);
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
    const {stocks = new Map<string, Stock[]>()} = this.state;
    const columns = [
      REFERENCE_COLUMN(170),
      DESIGNATION_COLUMN,
      LAIZE_COLUMN,
      COULEUR_PAPIER_COLUMN,
      GRAMMAGE_COLUMN,
      STOCK_COLUMN(stocks),
      MULTI_POSE_COLUMN,
      IMPORTANCE_ORDRE_COULEUR_COLUMN,
      TYPE_IMPRESSION_COLUMN,
      LAST_UPDATE_COLUMN,
    ];
    return (
      <Picker<BobineFilleWithMultiPose>
        getHash={r => r.ref}
        getSelectable={p => p.selectableBobines}
        store={bobinesFillesWithMultiPoseStore}
        title="Choix des bobines"
        // dataFilter={p => p.couleurBobines !== 'POLYPRO'}
        searchColumns={columns}
      >
        {(elements, isSelectionnable) => (
          <SizeMonitor>
            {(width, height) => {
              const filterBarHeight = 32;
              const searchBarHeight = 32;
              const availableWidth = width;
              const availableHeight = height - filterBarHeight - searchBarHeight;
              return (
                <React.Fragment>
                  <Padding />
                  <SortableTable
                    width={availableWidth}
                    height={availableHeight}
                    data={elements}
                    lastUpdate={0}
                    columns={columns}
                    initialSort={{
                      index: 0,
                      asc: true,
                    }}
                    onRowClick={this.handleBobinesSelected}
                    rowStyles={papier => ({
                      opacity: isSelectionnable(papier) ? 1 : 0.5,
                      pointerEvents: isSelectionnable(papier) ? 'all' : 'none',
                    })}
                  />
                </React.Fragment>
              );
            }}
          </SizeMonitor>
        )}
      </Picker>
    );
  }
}

const Padding = styled.div`
  height: 32px;
`;
