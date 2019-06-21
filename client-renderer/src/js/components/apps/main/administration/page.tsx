import {groupBy} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {Page} from '@root/components/apps/main/page';
import {Button} from '@root/components/core/button';
import {bridge} from '@root/lib/bridge';
import {
  bobinesFillesStore,
  bobinesMeresStore,
  clichesStore,
  operationsStore,
  perfosStore,
  refentesStore,
  stocksStore,
} from '@root/stores/list_store';
import {theme} from '@root/theme';

import {
  BobineFille,
  BobineMere,
  Cliche,
  Perfo,
  Refente,
  Operation,
  Stock,
  ClientAppType,
} from '@shared/models';

enum AdministrationTab {
  BobinesFilles,
  BobinesMeres,
  Cliches,
  Refentes,
  Perfos,
}

interface Props {}

interface State {
  bobinesFilles?: BobineFille[];
  bobinesMeres?: BobineMere[];
  cliches?: Cliche[];
  refentes?: Refente[];
  perfos?: Perfo[];
  stocks?: {[key: string]: Stock[]};
  operations?: Operation[];

  currentTab: AdministrationTab;
}

export class AdministrationPage extends React.Component<Props, State> {
  public static displayName = 'AdministrationPage';

  public constructor(props: Props) {
    super(props);
    this.state = {currentTab: AdministrationTab.BobinesFilles};
  }

  public componentDidMount(): void {
    bobinesFillesStore.addListener(this.handleBobinesFillesChange);
    bobinesMeresStore.addListener(this.handleBobinesMeresChange);
    clichesStore.addListener(this.handleClichesChange);
    stocksStore.addListener(this.handleStocksChange);
    refentesStore.addListener(this.handleRefentesChange);
    perfosStore.addListener(this.handlePerfosChange);
    operationsStore.addListener(this.handleOperationsChange);
  }

  public componentWillUnmount(): void {
    bobinesFillesStore.removeListener(this.handleBobinesFillesChange);
    bobinesMeresStore.removeListener(this.handleBobinesMeresChange);
    clichesStore.removeListener(this.handleClichesChange);
    stocksStore.removeListener(this.handleStocksChange);
    refentesStore.removeListener(this.handleRefentesChange);
    perfosStore.removeListener(this.handlePerfosChange);
    operationsStore.removeListener(this.handleOperationsChange);
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

  private readonly handleOperationsChange = (): void => {
    this.setState({operations: operationsStore.getData()});
  };

  public renderListAppButton(
    title: string,
    type: ClientAppType,
    data?: {length: number}
  ): JSX.Element {
    const countStr = data ? ` (${data.length})` : '';
    return <AdminButton onClick={() => bridge.openApp(type)}>{title + countStr}</AdminButton>;
  }

  public render(): JSX.Element {
    const {bobinesFilles, bobinesMeres, cliches, refentes, perfos, operations} = this.state;

    return (
      <Page>
        <Title>GESCOM</Title>
        {this.renderListAppButton(
          'Bobines Filles',
          ClientAppType.ListBobinesFillesApp,
          bobinesFilles
        )}
        {this.renderListAppButton('Bobines Mères', ClientAppType.ListBobinesMeresApp, bobinesMeres)}
        {this.renderListAppButton('Clichés', ClientAppType.ListClichesApp, cliches)}
        <Title>Production</Title>
        {this.renderListAppButton('Refentes', ClientAppType.ListRefentesApp, refentes)}
        {this.renderListAppButton('Perfos', ClientAppType.ListPerfosApp, perfos)}
        {this.renderListAppButton('Operations', ClientAppType.ListOperationsApp, operations)}
      </Page>
    );
  }
}

const AdminButton = styled(Button)`
  margin-right: 16px;
`;

const Title = styled.div`
  color: ${theme.administration.titleColor};
  font-size: 24px;
  padding-bottom: 16px;
  width: 100%;
  margin: 16px 0;
  border-bottom: solid 1px ${theme.administration.titleColor};
`;
