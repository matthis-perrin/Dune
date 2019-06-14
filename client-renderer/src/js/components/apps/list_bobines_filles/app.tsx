import * as React from 'react';

import {AdminTable, LoadingTable} from '@root/components/apps/main/administration/admin_table';
import {BobineFilleColumns, BOBINE_FILLE_REF} from '@root/components/table/columns';
import {bobinesFillesStore, stocksStore} from '@root/stores/list_store';

import {BobineFille, Stock} from '@shared/models';

interface Props {}

interface State {
  bobinesFilles?: BobineFille[];
  stocks?: Map<string, Stock[]>;
  lastUpdate: number;
}

export class ListBobinesFillesApp extends React.Component<Props, State> {
  public static displayName = 'ListBobinesFillesApp';

  public constructor(props: Props) {
    super(props);
    this.state = {lastUpdate: 0};
  }

  public componentDidMount(): void {
    bobinesFillesStore.addListener(this.handleBobinesFillesChange);
    stocksStore.addListener(this.handleStocksChange);
  }

  public componentWillUnmount(): void {
    bobinesFillesStore.removeListener(this.handleBobinesFillesChange);
    stocksStore.removeListener(this.handleStocksChange);
  }

  private getLatestLocalUpdate(): number {
    return Math.max(bobinesFillesStore.getLastUpdate(), stocksStore.getLastUpdate());
  }

  private readonly handleBobinesFillesChange = (): void => {
    const bobinesFilles = bobinesFillesStore.getData();
    document.title = `Liste des bobines filles (${bobinesFilles ? bobinesFilles.length : 0})`;
    this.setState({bobinesFilles, lastUpdate: this.getLatestLocalUpdate()});
  };

  private readonly handleStocksChange = (): void => {
    this.setState({
      stocks: stocksStore.getStockIndex(),
      lastUpdate: this.getLatestLocalUpdate(),
    });
  };

  public render(): JSX.Element {
    const {bobinesFilles, stocks, lastUpdate} = this.state;

    if (!bobinesFilles || !stocks) {
      return <LoadingTable>Loading...</LoadingTable>;
    }
    return (
      <AdminTable
        title="bobine"
        data={bobinesFilles}
        lastUpdate={lastUpdate}
        columns={[
          BOBINE_FILLE_REF,
          BobineFilleColumns.Designation,
          BobineFilleColumns.Laize,
          BobineFilleColumns.Longueur,
          BobineFilleColumns.CouleurPapier,
          BobineFilleColumns.Grammage,
          BobineFilleColumns.TypeImpression,
          BobineFilleColumns.RefCliche1,
          BobineFilleColumns.RefCliche2,
          BobineFilleColumns.Stock(stocks),
          BobineFilleColumns.LastUpdate,
        ]}
      />
    );
  }
}
