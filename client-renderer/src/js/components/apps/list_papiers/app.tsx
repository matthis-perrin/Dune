import React from 'react';

import {LoadingScreen} from '@root/components/core/loading_screen';
import {AdminTable} from '@root/components/table/admin_table';
import {
  BOBINE_MERE_REF_COLUMN,
  DESIGNATION_COLUMN,
  LAIZE_COLUMN,
  COULEUR_PAPIER_COLUMN,
  GRAMMAGE_COLUMN,
  STOCK_TERME_COLUMN,
  STOCK_REEL_COLUMN,
  STOCK_COMMANDE_COLUMN,
  REAL_LONGUEUR_COLUMN,
} from '@root/components/table/columns';
import {bobinesMeresStore, stocksStore} from '@root/stores/list_store';

import {BobineMere, Stock} from '@shared/models';

interface Props {}

interface State {
  papiers?: BobineMere[];
  stocks?: Map<string, Stock[]>;
}

export class ListPapiersApp extends React.Component<Props, State> {
  public static displayName = 'ListPapiersApp';

  public constructor(props: Props) {
    super(props);
    this.state = {};
  }

  public componentDidMount(): void {
    bobinesMeresStore.addListener(this.handleBobinesMeresChange);
    stocksStore.addListener(this.handleStocksChange);
  }

  public componentWillUnmount(): void {
    bobinesMeresStore.removeListener(this.handleBobinesMeresChange);
    stocksStore.removeListener(this.handleStocksChange);
  }

  private readonly handleBobinesMeresChange = (): void => {
    const bobineMeres = bobinesMeresStore.getData();
    const papiers = bobineMeres && bobineMeres.filter((b) => b.couleurPapier !== 'POLYPRO');
    document.title = `Liste des papiers (${papiers ? papiers.length : 0})`;
    this.setState({papiers});
  };

  private readonly handleStocksChange = (): void => {
    this.setState({
      stocks: stocksStore.getStockIndex(),
    });
  };

  public render(): JSX.Element {
    const {papiers, stocks} = this.state;

    if (!papiers || !stocks) {
      return <LoadingScreen />;
    }

    return (
      <AdminTable
        data={papiers}
        columns={[
          BOBINE_MERE_REF_COLUMN,
          DESIGNATION_COLUMN,
          LAIZE_COLUMN,
          REAL_LONGUEUR_COLUMN,
          COULEUR_PAPIER_COLUMN,
          GRAMMAGE_COLUMN,
          STOCK_REEL_COLUMN(stocks),
          STOCK_COMMANDE_COLUMN(stocks),
          STOCK_TERME_COLUMN(stocks),
        ]}
      />
    );
  }
}
