import {groupBy} from 'lodash-es';
import * as React from 'react';

import {AdminTable, LoadingTable} from '@root/components/apps/main/administration/admin_table';
import {getBobineMereColumns} from '@root/components/table/table_columns';
import {bobinesMeresStore, stocksStore} from '@root/stores/list_store';

import {BobineMere, Stock} from '@shared/models';

interface Props {}

interface State {
  bobinesMeres?: BobineMere[];
  stocks?: {[key: string]: Stock[]};
  lastUpdate: number;
}

export class ListBobinesMeresApp extends React.Component<Props, State> {
  public static displayName = 'ListBobinesMeresApp';

  public constructor(props: Props) {
    super(props);
    this.state = {lastUpdate: 0};
  }

  public componentDidMount(): void {
    bobinesMeresStore.addListener(this.handleBobinesMeresChange);
    stocksStore.addListener(this.handleStocksChange);
  }

  public componentWillUnmount(): void {
    bobinesMeresStore.removeListener(this.handleBobinesMeresChange);
    stocksStore.removeListener(this.handleStocksChange);
  }

  private getLatestLocalUpdate(): number {
    return Math.max(bobinesMeresStore.getLastUpdate(), stocksStore.getLastUpdate());
  }

  private readonly handleBobinesMeresChange = (): void => {
    const bobinesMeres = bobinesMeresStore.getData();
    document.title = `Liste des bobines mères (${bobinesMeres ? bobinesMeres.length : 0})`;
    this.setState({bobinesMeres, lastUpdate: this.getLatestLocalUpdate()});
  };

  private readonly handleStocksChange = (): void => {
    this.setState({
      stocks: groupBy(stocksStore.getData(), 'ref'),
      lastUpdate: this.getLatestLocalUpdate(),
    });
  };

  public render(): JSX.Element {
    const {bobinesMeres, stocks, lastUpdate} = this.state;

    if (!bobinesMeres || !stocks) {
      return <LoadingTable>Loading...</LoadingTable>;
    }
    return (
      <AdminTable
        title="bobine"
        data={bobinesMeres}
        lastUpdate={lastUpdate}
        columns={getBobineMereColumns(stocks)}
      />
    );
  }
}
