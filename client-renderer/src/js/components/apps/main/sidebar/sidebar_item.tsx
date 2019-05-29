import * as React from 'react';
import styled from 'styled-components';

import {FlexParent} from '@root/components/core/flex';
import {SVGIcon, SVGIconName} from '@root/components/core/svg_icon';
import {Typo} from '@root/components/core/typography';
import {theme} from '@root/theme/default';

interface Props {
  title: string;
  icon: SVGIconName;
  isSelected?: boolean;
  onClick(): void;
}

export class SidebarItem extends React.Component<Props, {}> {
  public static displayName = 'Sidebar';

  public render(): JSX.Element {
    const {title, icon, onClick} = this.props;
    return (
      <SidebarItemContainer alignItems="center" onClick={onClick}>
        <SVGIcon name={icon} width={16} height={16} marginRight={6} />
        <Typo.SubTitle>{title}</Typo.SubTitle>
      </SidebarItemContainer>
    );
  }
}

const SidebarItemContainer = styled(FlexParent)`
  height: ${theme.sidebar.itemHeight}px;
  cursor: pointer;
`;
