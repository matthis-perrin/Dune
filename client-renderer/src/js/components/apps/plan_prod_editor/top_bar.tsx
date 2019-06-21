import * as React from 'react';
import styled from 'styled-components';

import {theme} from '@root/theme';

interface TopBarProps {
  planProdRef: string;
}

export class TopBar extends React.Component<TopBarProps> {
  public static displayName = 'TopBar';

  public render(): JSX.Element {
    const {planProdRef} = this.props;
    return (
      <TopBarWrapper>
        <LeftContainer>Left Side</LeftContainer>
        <CenterContainer>
          <TopBarTitle>{`PRODUCTION N°${planProdRef}`}</TopBarTitle>
        </CenterContainer>
        <RightContainer>Right Side</RightContainer>
      </TopBarWrapper>
    );
  }
}

const TopBarWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: ${theme.planProd.topBarHeight}px;
  display: flex;
  background-color: ${theme.planProd.topBarBackgroundColor};
  color: ${theme.planProd.topBarTextColor}
  padding: 0 32px;
`;

const ContainerBase = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const LeftContainer = styled(ContainerBase)`
  flex-basis: 1px;
  flex-grow: 1;
  align-items: flex-start;
`;
const RightContainer = styled(ContainerBase)`
  flex-basis: 1px;
  flex-grow: 1;
  align-items: flex-end;
`;

const CenterContainer = styled(ContainerBase)`
  align-items: center;
`;

const TopBarTitle = styled.div`
  color: ${theme.planProd.topBarTitleColor};
  font-size: ${theme.planProd.topBarTitleFontSize}px;
  font-size: ${theme.planProd.topBarTitleFontWeight};
`;
