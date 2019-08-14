import * as React from 'react';
import styled from 'styled-components';

import {Herisson} from '@root/components/apps/main/sidebar/herisson';
import {SidebarItem} from '@root/components/apps/main/sidebar/sidebar_item';
import {FlexParent} from '@root/components/core/flex';
import {bridge} from '@root/lib/bridge';
import {AppPage, appStore} from '@root/stores/app_store';
import {theme} from '@root/theme';

import {ClientAppType} from '@shared/models';

interface Props {}

interface State {
  currentPage: AppPage;
}

const SidebarPages: AppPage[] = [AppPage.Gestion, AppPage.Administration];
const sidebarPadding = (theme.sidebar.width - theme.sidebar.logoSize) / 2;

const logoSize = 140;

export class Sidebar extends React.Component<Props, State> {
  public static displayName = 'Sidebar';

  public constructor(props: Props) {
    super(props);
    this.state = {
      currentPage: appStore.getState().currentPage,
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
      currentPage: appStore.getState().currentPage,
    });
  };

  public render(): JSX.Element {
    const {currentPage} = this.state;
    const pageIndex = SidebarPages.indexOf(currentPage) || 0;
    return (
      <SidebarContainer>
        <SidebarTitle>
          <Herisson style={{width: logoSize}} />
        </SidebarTitle>
        <FlexParent alignItems="stretch">
          <SidebarSelectedIndicator index={pageIndex} />
          <SidebarItemContainer flexDirection="column">
            <SidebarItem
              key={'gestion'}
              title={'Gestion'}
              isSelected={pageIndex === 0}
              onClick={() => appStore.setCurrentPage(AppPage.Gestion)}
            />
            <SidebarItem
              key={'gescom'}
              title={'Gescom'}
              isSelected={pageIndex === 1}
              onClick={() => appStore.setCurrentPage(AppPage.Administration)}
            />
            <SidebarItem
              key={'production'}
              title={'Production'}
              isSelected={false}
              onClick={() => {
                bridge.openApp(ClientAppType.ProductionApp).catch(console.error);
              }}
            />
            <SidebarItem
              key={'statistiques'}
              title={'Statistiques'}
              isSelected={false}
              onClick={() => {
                bridge.openApp(ClientAppType.StatisticsApp).catch(console.error);
              }}
            />
            <SidebarItem
              key={'rapports'}
              title={'Rapports'}
              isSelected={false}
              onClick={() => {
                bridge.openApp(ClientAppType.ReportsApp).catch(console.error);
              }}
            />
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
