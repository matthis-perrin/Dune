import * as React from 'react';
import styled from 'styled-components';

import {Herisson} from '@root/components/apps/main/sidebar/herisson';
import {SidebarItem} from '@root/components/apps/main/sidebar/sidebar_item';
import {FlexParent} from '@root/components/core/flex';
import {bridge} from '@root/lib/bridge';
import {AppPage, appStore} from '@root/stores/app_store';
import {theme} from '@root/theme';

import {ClientAppType, Config} from '@shared/models';

interface Props {
  config: Config;
}

interface State {
  currentPage?: AppPage;
}

const sidebarPadding = (theme.sidebar.width - theme.sidebar.logoSize) / 2;

const logoSize = 140;

export class Sidebar extends React.Component<Props, State> {
  public static displayName = 'Sidebar';

  public constructor(props: Props) {
    super(props);
    this.state = {
      currentPage: appStore.getCurrentPage(this.props.config),
    };
  }

  public componentDidMount(): void {
    appStore.addListener(this.handleStoreChanged);
  }

  public componentWillUnmount(): void {
    appStore.removeListener(this.handleStoreChanged);
  }

  private readonly handleStoreChanged = (): void => {
    this.setState({
      currentPage: appStore.getCurrentPage(this.props.config),
    });
  };

  private getIndex(): number {
    const {config} = this.props;
    const {currentPage} = this.state;
    if (currentPage === undefined) {
      return -1;
    }
    if (currentPage === AppPage.Gestion) {
      return 0;
    }
    if (currentPage === AppPage.Administration) {
      return config.hasGestionPage ? 1 : 0;
    }
    return -1;
  }

  public render(): JSX.Element {
    const {config} = this.props;
    const {currentPage} = this.state;
    const index = this.getIndex();
    return (
      <SidebarContainer>
        <SidebarTitle>
          <Herisson style={{width: logoSize}} />
        </SidebarTitle>
        <FlexParent alignItems="stretch">
          {index === -1 ? <React.Fragment /> : <SidebarSelectedIndicator index={index} />}
          <SidebarItemContainer flexDirection="column">
            {config.hasGestionPage ? (
              <SidebarItem
                key={'gestion'}
                title={'Gestion'}
                isSelected={currentPage === AppPage.Gestion}
                onClick={() => appStore.setCurrentPage(AppPage.Gestion)}
              />
            ) : (
              <React.Fragment />
            )}
            {config.hasGescomPage ? (
              <SidebarItem
                key={'gescom'}
                title={'Gescom'}
                isSelected={currentPage === AppPage.Administration}
                onClick={() => appStore.setCurrentPage(AppPage.Administration)}
              />
            ) : (
              <React.Fragment />
            )}
            {config.hasProductionPage ? (
              <SidebarItem
                key={'production'}
                title={'Production'}
                isSelected={false}
                onClick={() => {
                  bridge.openApp(ClientAppType.ProductionApp).catch(console.error);
                }}
              />
            ) : (
              <React.Fragment />
            )}
            {config.hasStatsPage ? (
              <SidebarItem
                key={'statistiques'}
                title={'Statistiques'}
                isSelected={false}
                onClick={() => {
                  bridge.openApp(ClientAppType.StatisticsApp).catch(console.error);
                }}
              />
            ) : (
              <React.Fragment />
            )}
            {config.hasRapportPage ? (
              <SidebarItem
                key={'rapports'}
                title={'Rapports'}
                isSelected={false}
                onClick={() => {
                  bridge.openApp(ClientAppType.ReportsApp).catch(console.error);
                }}
              />
            ) : (
              <React.Fragment />
            )}
          </SidebarItemContainer>
        </FlexParent>
      </SidebarContainer>
    );
  }
}

const SidebarItemContainer = styled(FlexParent)`
  -webkit-app-region: no-drag;
`;

const SidebarSelectedIndicator = styled.div<{index: number}>`
  width: ${theme.sidebar.indicatorWidth}px;
  height: ${theme.sidebar.indicatorHeight}px;
  margin-top: ${(theme.sidebar.itemHeight - theme.sidebar.indicatorHeight) / 2}px;
  margin-right: ${theme.sidebar.indicatorSpacing}px;
  margin-left: ${-theme.sidebar.indicatorSpacing - theme.sidebar.indicatorWidth}px;
  transform: ${props => `translateY(${theme.sidebar.itemHeight * props.index}px)}`};
  transition: transform 100ms ease-in-out;
  background-color: ${theme.sidebar.selectedColor};
`;

const SidebarContainer = styled.div`
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: ${theme.sidebar.width}px;
  padding: ${sidebarPadding}px 0 0 ${sidebarPadding}px;
  box-sizing: border-box;
  -webkit-app-region: drag;
  background-color: ${theme.sidebar.backgroundColor};
`;

const SidebarTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${theme.sidebar.logoSize}px;
  height: ${theme.sidebar.logoSize}px;
  box-sizing: border-box;
  font-size: 48px;
  margin-bottom: ${sidebarPadding}px;
  background-color: ${theme.sidebar.logoBackgroundColor};
  color: ${theme.sidebar.logoColor};
`;
