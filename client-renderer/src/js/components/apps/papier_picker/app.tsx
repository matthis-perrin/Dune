import React from 'react';

import {Picker} from '@root/components/common/picker';
import {LoadingScreen} from '@root/components/core/loading_screen';
import {SizeMonitor} from '@root/components/core/size_monitor';
import {
  DESIGNATION_COLUMN,
  LAIZE_COLUMN,
  COULEUR_PAPIER_COLUMN,
  GRAMMAGE_COLUMN,
  STOCK_TERME_COLUMN,
  BOBINE_MERE_REF_COLUMN,
  STOCK_REEL_COLUMN,
  REAL_LONGUEUR_COLUMN,
} from '@root/components/table/columns';
import {SortableTable} from '@root/components/table/sortable_table';
import {bridge} from '@root/lib/bridge';
import {bobinesMeresStore, stocksStore} from '@root/stores/list_store';
import {ScheduleStore} from '@root/stores/schedule_store';
import {theme} from '@root/theme';

import {BobineMere, Stock, Schedule, MachineType} from '@shared/models';

interface Props {
  id: number;
  start: number;
  end: number;
}

interface State {
  stocks?: Map<string, Stock[]>;
  schedule?: Schedule;
}

export class PapierPickerApp extends React.Component<Props, State> {
  public static displayName = 'PapierPickerApp';
  private readonly scheduleStore: ScheduleStore;

  constructor(props: Props) {
    super(props);
    this.state = {};
    const {start, end} = props;
    this.scheduleStore = new ScheduleStore(MachineType.Mondon, {start, end});
  }

  private readonly handlePapierSelected = (bobineMere: BobineMere) => {
    bridge
      .setPlanPapier(this.props.id, bobineMere.ref)
      .then(() => {
        bridge.closeApp().catch(console.error);
      })
      .catch(console.error);
  };

  public componentDidMount(): void {
    stocksStore.addListener(this.handleValuesChanged);
    this.scheduleStore.start(this.handleValuesChanged);
  }

  public componentWillUnmount(): void {
    stocksStore.removeListener(this.handleValuesChanged);
    this.scheduleStore.stop();
  }

  private readonly handleValuesChanged = (): void => {
    this.setState({
      stocks: stocksStore.getStockIndex(),
      schedule: this.scheduleStore.getSchedule(),
    });
  };

  public render(): JSX.Element {
    const {id} = this.props;
    const {stocks} = this.state;
    if (!stocks) {
      return <LoadingScreen />;
    }

    const columns = [
      BOBINE_MERE_REF_COLUMN,
      DESIGNATION_COLUMN,
      LAIZE_COLUMN,
      REAL_LONGUEUR_COLUMN,
      COULEUR_PAPIER_COLUMN,
      GRAMMAGE_COLUMN,
      STOCK_REEL_COLUMN(stocks),
      STOCK_TERME_COLUMN(stocks),
    ];
    return (
      <Picker<BobineMere>
        id={id}
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
                    rowStyles={papier => {
                      const selectable = isSelectionnable(papier);
                      return {
                        opacity: selectable ? 1 : theme.table.disabledOpacity,
                        pointerEvents: selectable ? 'all' : 'none',
                        cursor: selectable ? 'pointer' : 'default',
                      };
                    }}
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
