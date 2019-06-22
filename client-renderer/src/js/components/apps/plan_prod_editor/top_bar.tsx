import * as React from 'react';
import styled from 'styled-components';

import {Input} from '@root/components/core/input';
import {theme} from '@root/theme';

interface TopBarProps {
  planProdRef: string;
  tourCount?: number;
  onTourCountChange(tourCount?: number): void;
}

export class TopBar extends React.Component<TopBarProps> {
  public static displayName = 'TopBar';

  private readonly handleTourCountInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const {onTourCountChange} = this.props;
    console.log(event.target.value);
    try {
      const newTourCount = parseFloat(event.target.value);
      if (isNaN(newTourCount) || !isFinite(newTourCount) || newTourCount < 0) {
        onTourCountChange(0);
      } else {
        onTourCountChange(newTourCount);
      }
    } catch {
      onTourCountChange(undefined);
    }
  };

  public render(): JSX.Element {
    const {planProdRef, tourCount} = this.props;
    return (
      <TopBarWrapper>
        <LeftContainer>
          <div style={{marginBottom: 6}}>
            <TopBarInput value="180" />
            m/min
          </div>
          <div>
            <TopBarInput
              value={tourCount === undefined ? '' : String(tourCount)}
              onChange={this.handleTourCountInputChange}
            />
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
  z-index: 100;
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
  font-weight: ${theme.planProd.topBarTitleFontWeight};
`;

const TopBarInput = styled(Input)`
  margin-right: 8px;
  width: 54px;
  text-align: center;
`;
