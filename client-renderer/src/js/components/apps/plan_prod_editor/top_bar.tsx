import * as React from 'react';
import styled from 'styled-components';

import {Duration} from '@root/components/common/duration';
import {Button} from '@root/components/core/button';
import {Input} from '@root/components/core/input';
import {bridge} from '@root/lib/bridge';
import {theme, Palette} from '@root/theme';

import {PlanProductionState, BobineFilleWithPose} from '@shared/models';

const MAX_SPEED_RATIO = 0.82;

interface TopBarProps {
  planProdRef: string;
  planProduction: PlanProductionState;
  tourCount?: number;
  speed: number;
  onTourCountChange(tourCount?: number): void;
  onSpeedChange(speed: number): void;
  isPrinting: boolean;
}

export class TopBar extends React.Component<TopBarProps> {
  public static displayName = 'TopBar';

  private readonly handleTourCountInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const {onTourCountChange} = this.props;
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

  private readonly handleSave = (): void => {
    bridge.saveToPDF().catch(console.error);
  };

  private readonly handleSpeedInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const {onSpeedChange} = this.props;
    try {
      const newTourCount = parseFloat(event.target.value);
      if (isNaN(newTourCount) || !isFinite(newTourCount) || newTourCount < 0) {
        onSpeedChange(0);
      } else {
        onSpeedChange(newTourCount);
      }
    } catch {
      onSpeedChange(0);
    }
  };

  private computeProductionTime(
    firstBobine: BobineFilleWithPose,
    speed: number,
    tourCount: number
  ): number {
    const actualSpeed = MAX_SPEED_RATIO * speed;
    const lengthToProduce = tourCount * (firstBobine.longueur || 0);
    return Math.round((lengthToProduce / actualSpeed) * 60);
  }

  public render(): JSX.Element {
    const {planProdRef, planProduction, tourCount, speed, isPrinting} = this.props;

    const productionTimeInSec =
      planProduction.selectedBobines.length > 0 && speed > 0 && tourCount && tourCount > 0
        ? this.computeProductionTime(planProduction.selectedBobines[0], speed, tourCount)
        : undefined;

    const WrapperClass = isPrinting ? TopBarWrapperWhenPrinting : TopBarWrapper;

    return (
      <WrapperClass>
        <LeftContainer>
          <div style={{marginBottom: 6}}>
            <TopBarInput value={speed} onChange={this.handleSpeedInputChange} />
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
          {isPrinting ? (
            <React.Fragment />
          ) : (
            <Button onClick={this.handleSave}>Téléchargement</Button>
          )}
        </CenterContainer>
        <RightContainer>
          <div>
            Production: <Duration durationMs={(productionTimeInSec || 0) * 1000} />
          </div>
        </RightContainer>
      </WrapperClass>
    );
  }
}

const TopBarWrapperBase = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: ${theme.planProd.topBarHeight}px;
  display: flex;
  padding: 0 32px;
  z-index: 100;
`;

const TopBarWrapper = styled(TopBarWrapperBase)`
  background-color: ${theme.planProd.topBarBackgroundColor};
  color: ${theme.planProd.topBarTextColor};
`;

const TopBarWrapperWhenPrinting = styled(TopBarWrapperBase)`
  background-color: ${Palette.Transparent};
  color: ${Palette.Black};
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
  font-size: ${theme.planProd.topBarTitleFontSize}px;
  font-weight: ${theme.planProd.topBarTitleFontWeight};
`;

const TopBarInput = styled(Input)`
  margin-right: 8px;
  width: 54px;
  text-align: center;
`;
