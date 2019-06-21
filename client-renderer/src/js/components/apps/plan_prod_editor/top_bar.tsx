import * as React from 'react';
import styled from 'styled-components';

import {Input} from '@root/components/core/input';
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
        <LeftContainer>
          <div style={{marginBottom: 6}}>
            <TopBarInput value="180" />
            m/min
          </div>
          <div>
            <TopBarInput value="50" />
            tours
          </div>
        </LeftContainer>
        <CenterContainer>
          <TopBarTitle>{`PRODUCTION N°${planProdRef}`}</TopBarTitle>
        </CenterContainer>
        <RightContainer>
          <div>Début production: 06h00</div>
          <div>Réglage: 01:20:00</div>
          <div>Production: 00:20:10</div>
          <div>Fin production: 07h40</div>
        </RightContainer>
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
  font-size: ${theme.planProd.topBarDetailsFontSize}px;
`;

const CenterContainer = styled(ContainerBase)`
  align-items: center;
`;

const TopBarTitle = styled.div`
  color: ${theme.planProd.topBarTitleColor};
  font-size: ${theme.planProd.topBarTitleFontSize}px;
  font-size: ${theme.planProd.topBarTitleFontWeight};
`;

const TopBarInput = styled(Input)`
  margin-right: 8px;
  width: 54px;
  text-align: center;
`;
