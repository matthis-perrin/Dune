import {groupBy} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {PlanProduction} from '@root/components/apps/main/gestion/plan_production';
import {Page} from '@root/components/apps/main/page';
import {PlanProductionEngine} from '@root/lib/plan_production/algo';
import {
  bobinesFillesStore,
  bobinesMeresStore,
  clichesStore,
  perfosStore,
  refentesStore,
  stocksStore,
} from '@root/stores/list_store';

import {BobineFille, BobineMere, Cliche, Perfo, Refente, Stock} from '@shared/models';

interface Props {}

interface State {
  bobinesFilles?: BobineFille[];
  bobinesMeres?: BobineMere[];
  cliches?: Cliche[];
  refentes?: Refente[];
  perfos?: Perfo[];
  stocks?: {[key: string]: Stock[]};
  planProductionEngine?: PlanProductionEngine;
}

export class GestionPage extends React.Component<Props, State> {
  public static displayName = 'GestionPage';

  public constructor(props: Props) {
    super(props);
    this.state = {
      bobinesFilles: bobinesFillesStore.getData(),
      bobinesMeres: bobinesMeresStore.getData(),
      cliches: clichesStore.getData(),
      stocks: groupBy(stocksStore.getData(), 'ref'),
      refentes: refentesStore.getData(),
      perfos: perfosStore.getData(),
    };
  }

  public componentDidMount(): void {
    bobinesFillesStore.addListener(this.handleBobinesFillesChange);
    bobinesMeresStore.addListener(this.handleBobinesMeresChange);
    clichesStore.addListener(this.handleClichesChange);
    stocksStore.addListener(this.handleStocksChange);
    refentesStore.addListener(this.handleRefentesChange);
    perfosStore.addListener(this.handlePerfosChange);
  }

  public componentWillUnmount(): void {
    bobinesFillesStore.removeListener(this.handleBobinesFillesChange);
    bobinesMeresStore.removeListener(this.handleBobinesMeresChange);
    clichesStore.removeListener(this.handleClichesChange);
    stocksStore.removeListener(this.handleStocksChange);
    refentesStore.removeListener(this.handleRefentesChange);
    perfosStore.removeListener(this.handlePerfosChange);
  }

  private readonly handleBobinesFillesChange = (): void => {
    this.setState({bobinesFilles: bobinesFillesStore.getData()});
  };

  private readonly handleBobinesMeresChange = (): void => {
    this.setState({bobinesMeres: bobinesMeresStore.getData()});
  };

  private readonly handleClichesChange = (): void => {
    this.setState({cliches: clichesStore.getData()});
  };

  private readonly handleStocksChange = (): void => {
    this.setState({stocks: groupBy(stocksStore.getData(), 'ref')});
  };

  private readonly handleRefentesChange = (): void => {
    this.setState({refentes: refentesStore.getData()});
  };

  private readonly handlePerfosChange = (): void => {
    this.setState({perfos: perfosStore.getData()});
  };

  public render(): JSX.Element {
    const {bobinesFilles, bobinesMeres, cliches, stocks, refentes, perfos} = this.state;

    const content =
      bobinesFilles && bobinesMeres && cliches && stocks && refentes && perfos ? (
        <PlanProduction
          bobinesFilles={bobinesFilles}
          bobinesMeres={bobinesMeres}
          cliches={cliches}
          stocks={stocks}
          refentes={refentes}
          perfos={perfos}
        />
      ) : (
        <Loading>Loading...</Loading>
      );

    return <Page>{content}</Page>;
  }
}

const Loading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;
