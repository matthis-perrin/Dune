import * as React from 'react';
import styled from 'styled-components';

import {Duration} from '@root/components/common/duration';
import {Button} from '@root/components/core/button';
import {Input} from '@root/components/core/input';
import {bridge} from '@root/lib/bridge';
import {theme, Palette, FontWeight} from '@root/theme';

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
    bridge.saveToPDF(`plan_prod_${this.props.planProdRef}.pdf`).catch(console.error);
  };

  // private readonly handlePrint = (): void => {
  //   bridge.print().catch(console.error);
  // };

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

  private isComplete(): boolean {
    const {planProduction, tourCount, speed} = this.props;
    return (
      tourCount !== undefined &&
      tourCount > 0 &&
      speed > 0 &&
      planProduction.selectablePapiers.length === 0 &&
      planProduction.selectableBobines.length === 0 &&
      planProduction.selectablePerfos.length === 0 &&
      planProduction.selectablePolypros.length === 0 &&
      planProduction.selectableRefentes.length === 0
    );
  }

  private renderButtons(): JSX.Element {
    const {isPrinting} = this.props;
    if (!this.isComplete() || isPrinting) {
      return <React.Fragment />;
    }
    return (
      <ButtonsContainer>
        <Button style={{marginRight: 8}} onClick={this.handleSave}>
          Télécharger
        </Button>
        {/* <Button onClick={this.handlePrint}>Imprimer</Button> */}
      </ButtonsContainer>
    );
  }

  public render(): JSX.Element {
    const {planProdRef, planProduction, tourCount, speed, isPrinting} = this.props;

    const productionTimeInSec =
      planProduction.selectedBobines.length > 0 && speed > 0 && tourCount && tourCount > 0
        ? this.computeProductionTime(planProduction.selectedBobines[0], speed, tourCount)
        : undefined;

    if (isPrinting) {
      return (
        <TopBarWrapperWhenPrinting>
          <PrintingLeftContainer>
            <PrintingLeftContainerBlock style={{marginRight: 32}}>
              <LargeValue>{speed}</LargeValue>
              <SmallValue> m/min</SmallValue>
            </PrintingLeftContainerBlock>
            <PrintingLeftContainerBlock>
              <LargeValue>{tourCount}</LargeValue>
              <SmallValue>tours</SmallValue>
            </PrintingLeftContainerBlock>
          </PrintingLeftContainer>
          <CenterContainer>
            <PrintingTopBarTitle>{`PRODUCTION N°${planProdRef}`}</PrintingTopBarTitle>
            {this.renderButtons()}
          </CenterContainer>
          <RightContainer>
            <div>
              <LargeValue>
                Production: <Duration durationMs={(productionTimeInSec || 0) * 1000} />
              </LargeValue>
            </div>
          </RightContainer>
        </TopBarWrapperWhenPrinting>
      );
    }

    return (
      <TopBarWrapper>
        <LeftContainer>
          <div style={{marginBottom: 6}}>
            <TopBarInput value={speed} onChange={this.handleSpeedInputChange} /> m/min
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
          {this.renderButtons()}
        </CenterContainer>
        <RightContainer>
          <div>
            Production: <Duration durationMs={(productionTimeInSec || 0) * 1000} />
          </div>
        </RightContainer>
      </TopBarWrapper>
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
  border: ${theme.planProd.printingBorder};
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
  font-size: ${theme.planProd.topBarDetailsFontSize}px;
`;

const RightContainer = styled(ContainerBase)`
  flex-basis: 1px;
  flex-grow: 1;
  align-items: flex-end;
  font-size: ${theme.planProd.topBarDetailsFontSize}px;
`;

const CenterContainer = styled(ContainerBase)`
  align-items: center;
  justify-content: space-evenly;
`;

const ButtonsContainer = styled.div`
  display: flex;
`;

const TopBarTitle = styled.div`
  font-size: ${theme.planProd.topBarTitleFontSize}px;
  font-weight: ${theme.planProd.topBarTitleFontWeight};
`;

const PrintingTopBarTitle = styled.div`
  font-size: 30px;
  font-weight: ${FontWeight.SemiBold};
`;

const TopBarInput = styled(Input)`
  margin-right: 8px;
  width: 54px;
  text-align: center;
`;

const LargeValue = styled.div`
  font-size: 20px;
  font-weight: ${FontWeight.SemiBold};
`;

const SmallValue = styled.div`
  font-size: 14px;
  font-weight: ${FontWeight.Regular};
`;

const PrintingLeftContainerBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const PrintingLeftContainer = styled.div`
  flex-basis: 1px;
  flex-grow: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
`;
