import * as React from 'react';
import styled from 'styled-components';

import {Picker} from '@root/components/common/picker';
import {SizeMonitor} from '@root/components/core/size_monitor';
import {
  DESIGNATION_COLUMN,
  LAIZE_COLUMN,
  COULEUR_PAPIER_COLUMN,
  GRAMMAGE_COLUMN,
  STOCK_COLUMN,
  LAST_UPDATE_COLUMN,
  TYPE_IMPRESSION_COLUMN,
  MULTI_POSE_COLUMN,
  COULEURS_IMPRESSION_COLUMN,
  BOBINE_FILLE_REF,
} from '@root/components/table/columns';
import {SortableTable} from '@root/components/table/sortable_table';
// import {bridge} from '@root/lib/bridge';
import {
  bobinesFillesWithMultiPoseStore,
  stocksStore,
  cadencierStore,
} from '@root/stores/list_store';

import {Stock, BobineFilleWithMultiPose} from '@shared/models';

interface Props {}

interface State {
  stocks?: Map<string, Stock[]>;
  cadencier?: Map<string, Map<number, number>>;
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
  }

  public componentWillUnmount(): void {
    stocksStore.removeListener(this.handleValuesChanged);
    cadencierStore.removeListener(this.handleValuesChanged);
  }

  private readonly handleValuesChanged = (): void => {
    this.setState({
      stocks: stocksStore.getStockIndex(),
      cadencier: cadencierStore.getCadencierIndex(),
    });
  };

  public render(): JSX.Element {
    const {stocks = new Map<string, Stock[]>(), cadencier} = this.state;
    const columns = [
      BOBINE_FILLE_REF,
      DESIGNATION_COLUMN,
      LAIZE_COLUMN,
      COULEUR_PAPIER_COLUMN,
      GRAMMAGE_COLUMN,
      STOCK_COLUMN(stocks),
      MULTI_POSE_COLUMN,
      COULEURS_IMPRESSION_COLUMN,
      TYPE_IMPRESSION_COLUMN,
      LAST_UPDATE_COLUMN,
    ];
    console.log(cadencier);
    return (
      <Picker<BobineFilleWithMultiPose>
        getHash={r => r.ref}
        getSelectable={p => p.selectableBobines}
        store={bobinesFillesWithMultiPoseStore}
        title="Choix des bobines"
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
                    lastUpdate={Date.now()}
                    columns={columns}
                    initialSort={{
                      index: 0,
                      asc: true,
                    }}
                    rowStyles={bobine => ({
                      opacity: isSelectionnable(bobine) ? 1 : 0.5,
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
