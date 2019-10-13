import * as React from 'react';

import {LoadingScreen} from '@root/components/core/loading_screen';
import {AdminTable} from '@root/components/table/admin_table';
import {
  BOBINE_MERE_REF_COLUMN,
  DESIGNATION_COLUMN,
  LAIZE_COLUMN,
  STOCK_TERME_COLUMN,
  STOCK_REEL_COLUMN,
  STOCK_COMMANDE_COLUMN,
  REAL_LONGUEUR_COLUMN,
  GRAMMAGE_M2_COLUMN,
} from '@root/components/table/columns';
import {bobinesMeresStore, stocksStore} from '@root/stores/list_store';

import {BobineMere, Stock} from '@shared/models';

interface Props {}

interface State {
  polypros?: BobineMere[];
  stocks?: Map<string, Stock[]>;
}

export class ListPolyprosApp extends React.Component<Props, State> {
  public static displayName = 'ListPolyprosApp';

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
    const polypros = bobineMeres && bobineMeres.filter(b => b.couleurPapier === 'POLYPRO');
    document.title = `Liste des polypros (${polypros ? polypros.length : 0})`;
    this.setState({polypros});
  };

  private readonly handleStocksChange = (): void => {
    this.setState({
      stocks: stocksStore.getStockIndex(),
    });
  };

  public render(): JSX.Element {
    const {polypros, stocks} = this.state;

    if (!polypros || !stocks) {
      return <LoadingScreen />;
    }

    return (
      <AdminTable
        data={polypros}
        columns={[
          BOBINE_MERE_REF_COLUMN,
          DESIGNATION_COLUMN,
          LAIZE_COLUMN,
          REAL_LONGUEUR_COLUMN,
          GRAMMAGE_M2_COLUMN,
          STOCK_REEL_COLUMN(stocks),
          STOCK_COMMANDE_COLUMN(stocks),
          STOCK_TERME_COLUMN(stocks),
        ]}
      />
    );
  }
}
