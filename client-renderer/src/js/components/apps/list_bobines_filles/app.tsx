import * as React from 'react';

import {LoadingScreen} from '@root/components/core/loading_screen';
import {AdminTable} from '@root/components/table/admin_table';
import {
  BOBINE_FILLE_REF_COLUMN,
  DESIGNATION_COLUMN,
  LAIZE_COLUMN,
  LONGUEUR_COLUMN,
  COULEUR_PAPIER_COLUMN,
  GRAMMAGE_COLUMN,
  TYPE_IMPRESSION_COLUMN,
  REF_CLICHE1_COLUMN,
  REF_CLICHE2_COLUMN,
  STOCK_REEL_COLUMN,
  STOCK_TERME_COLUMN,
  STOCK_RESERVE_COLUMN,
} from '@root/components/table/columns';
import {bobinesFillesStore, stocksStore} from '@root/stores/list_store';

import {BobineFille, Stock} from '@shared/models';

interface Props {}

interface State {
  bobinesFilles?: BobineFille[];
  stocks?: Map<string, Stock[]>;
}

export class ListBobinesFillesApp extends React.Component<Props, State> {
  public static displayName = 'ListBobinesFillesApp';

  public constructor(props: Props) {
    super(props);
    this.state = {};
  }

  public componentDidMount(): void {
    bobinesFillesStore.addListener(this.handleBobinesFillesChange);
    stocksStore.addListener(this.handleStocksChange);
  }

  public componentWillUnmount(): void {
    bobinesFillesStore.removeListener(this.handleBobinesFillesChange);
    stocksStore.removeListener(this.handleStocksChange);
  }

  private readonly handleBobinesFillesChange = (): void => {
    const bobinesFilles = bobinesFillesStore.getData();
    document.title = `Liste des bobines filles (${bobinesFilles ? bobinesFilles.length : 0})`;
    this.setState({bobinesFilles});
  };

  private readonly handleStocksChange = (): void => {
    this.setState({
      stocks: stocksStore.getStockIndex(),
    });
  };

  public render(): JSX.Element {
    const {bobinesFilles, stocks} = this.state;

    if (!bobinesFilles || !stocks) {
      return <LoadingScreen />;
    }
    return (
      <AdminTable
        data={bobinesFilles}
        columns={[
          BOBINE_FILLE_REF_COLUMN,
          DESIGNATION_COLUMN,
          LAIZE_COLUMN,
          LONGUEUR_COLUMN,
          COULEUR_PAPIER_COLUMN,
          GRAMMAGE_COLUMN,
          TYPE_IMPRESSION_COLUMN,
          REF_CLICHE1_COLUMN,
          REF_CLICHE2_COLUMN,
          STOCK_REEL_COLUMN(stocks),
          STOCK_RESERVE_COLUMN(stocks),
          STOCK_TERME_COLUMN(stocks),
        ]}
      />
    );
  }
}
