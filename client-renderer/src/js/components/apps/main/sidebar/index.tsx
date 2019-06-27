import * as React from 'react';
import styled from 'styled-components';

import {SidebarItem} from '@root/components/apps/main/sidebar/sidebar_item';
import {FlexParent} from '@root/components/core/flex';
import {AppPage, appStore} from '@root/stores/app_store';
import {theme} from '@root/theme';

interface Props {}

interface State {
  currentPage: AppPage;
}

interface SidebarItemData {
  title: string;
}

const Pages: {[key: string]: SidebarItemData} = {
  // [AppPage.Production]: {title: 'Production'},
  [AppPage.Gestion]: {title: 'Gestion'},
  [AppPage.Administration]: {title: 'Administration'},
};
const SidebarPages: AppPage[] = [AppPage.Gestion, AppPage.Administration];
const sidebarPadding = (theme.sidebar.width - theme.sidebar.logoSize) / 2;

export class Sidebar extends React.Component<Props, State> {
  public static displayName = 'Sidebar';

  public constructor(props: Props) {
    super(props);
    this.state = {
      currentPage: appStore.getState().currentPage,
    };
  }

  public componentDidMount(): void {
    appStore.addListener(this.handleAppChange);
  }

  public componentWillUnmount(): void {
    appStore.removeListener(this.handleAppChange);
  }

  private readonly handleAppChange = (): void => {
    this.setState({currentPage: appStore.getState().currentPage});
  };

  public render(): JSX.Element {
    const {currentPage} = this.state;
    const pageIndex = SidebarPages.indexOf(currentPage) || 0;
    return (
      <SidebarContainer>
        <SidebarTitle>DUNE</SidebarTitle>
        <FlexParent alignItems="stretch">
          <SidebarSelectedIndicator index={pageIndex} />
          <SidebarItemContainer flexDirection="column">
            {SidebarPages.map((pageName, index) => {
              const {title} = Pages[pageName];
              return (
                <SidebarItem
                  key={title}
                  title={title}
                  isSelected={index === pageIndex}
                  onClick={() => appStore.setCurrentPage(pageName)}
                />
              );
            })}
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
