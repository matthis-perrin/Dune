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
  stocksStore,
} from '@root/stores/list_store';
import {theme, FontWeight} from '@root/theme';

import {BobineFille, BobineMere, Cliche, Stock, ClientAppType} from '@shared/models';

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
  stocks?: {[key: string]: Stock[]};

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
  }

  public componentWillUnmount(): void {
    bobinesFillesStore.removeListener(this.handleBobinesFillesChange);
    bobinesMeresStore.removeListener(this.handleBobinesMeresChange);
    clichesStore.removeListener(this.handleClichesChange);
    stocksStore.removeListener(this.handleStocksChange);
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

  public renderListAppButton(
    title: string,
    type: ClientAppType,
    data?: {length: number}
  ): JSX.Element {
    const countStr = data ? ` (${data.length})` : '';
    return <AdminButton onClick={() => bridge.openApp(type)}>{title + countStr}</AdminButton>;
  }

  public render(): JSX.Element {
    const {bobinesFilles, bobinesMeres, cliches} = this.state;

    return (
      <Page>
        <Title style={{marginTop: 0}}>GESCOM</Title>
        {this.renderListAppButton(
          'Bobines Filles',
          ClientAppType.ListBobinesFillesApp,
          bobinesFilles
        )}
        {this.renderListAppButton('Bobines Mères', ClientAppType.ListBobinesMeresApp, bobinesMeres)}
        {this.renderListAppButton('Clichés', ClientAppType.ListClichesApp, cliches)}
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
  font-weight: ${FontWeight.SemiLight};
  margin: 32px 0 16px 0;
`;
