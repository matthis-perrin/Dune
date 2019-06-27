import * as React from 'react';
import styled from 'styled-components';

import {theme} from '@root/theme';

interface Props {
  title: string;
  isSelected?: boolean;
  onClick(): void;
}

export class SidebarItem extends React.Component<Props, {}> {
  public static displayName = 'Sidebar';

  public render(): JSX.Element {
    const {title, onClick} = this.props;
    return (
      <SidebarItemContainer onClick={onClick}>
        {/* <SVGIcon name={icon} width={16} height={16} marginRight={6} /> */}
        <SidebarMenuItem>{title}</SidebarMenuItem>
      </SidebarItemContainer>
    );
  }
}

const SidebarItemContainer = styled.div`
  display: flex;
  align-items: center;
  height: ${theme.sidebar.itemHeight}px;
  cursor: pointer;
  transition: text-shadow 100ms ease-in-out;
  > svg {
    fill: ${theme.sidebar.itemColor};
  }
  &:hover {
    text-shadow: 0 0 1px ${theme.sidebar.itemColor};
  }
`;

const SidebarMenuItem = styled.div`
  font-size: ${theme.sidebar.itemFontSize}px;
  line-height: ${theme.sidebar.itemFontSize}px;
  font-weight: ${theme.sidebar.itemFontWeight};
  color: ${theme.sidebar.itemColor};
`;
