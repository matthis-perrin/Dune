import * as React from 'react';

import {LoadingScreen} from '@root/components/core/loading_screen';
import {AdminTable} from '@root/components/table/admin_table';
import {
  BOBINE_MERE_REF_COLUMN,
  DESIGNATION_COLUMN,
  LAIZE_COLUMN,
  LONGUEUR_COLUMN,
  COULEUR_PAPIER_COLUMN,
  GRAMMAGE_COLUMN,
  STOCK_TERME_COLUMN,
} from '@root/components/table/columns';
import {bobinesMeresStore, stocksStore} from '@root/stores/list_store';

import {BobineMere, Stock} from '@shared/models';

interface Props {}

interface State {
  bobinesMeres?: BobineMere[];
  stocks?: Map<string, Stock[]>;
}

export class ListBobinesMeresApp extends React.Component<Props, State> {
  public static displayName = 'ListBobinesMeresApp';

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
    const bobinesMeres = bobinesMeresStore.getData();
    document.title = `Liste des bobines mères (${bobinesMeres ? bobinesMeres.length : 0})`;
    this.setState({bobinesMeres});
  };

  private readonly handleStocksChange = (): void => {
    this.setState({
      stocks: stocksStore.getStockIndex(),
    });
  };

  public render(): JSX.Element {
    const {bobinesMeres, stocks} = this.state;

    if (!bobinesMeres || !stocks) {
      return <LoadingScreen />;
    }

    return (
      <AdminTable
        data={bobinesMeres}
        columns={[
          BOBINE_MERE_REF_COLUMN,
          DESIGNATION_COLUMN,
          LAIZE_COLUMN,
          LONGUEUR_COLUMN,
          COULEUR_PAPIER_COLUMN,
          GRAMMAGE_COLUMN,
          STOCK_TERME_COLUMN(stocks),
        ]}
      />
    );
  }
}
