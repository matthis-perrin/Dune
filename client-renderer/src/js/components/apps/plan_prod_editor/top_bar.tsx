import * as React from 'react';
import styled from 'styled-components';

import {Duration} from '@root/components/common/duration';
import {Button} from '@root/components/core/button';
import {Input} from '@root/components/core/input';
import {TopBottom} from '@root/components/core/top_bottom';
import {numberWithSeparator} from '@root/lib/utils';
import {theme, Palette, FontWeight, Colors} from '@root/theme';

import {BobineFilleWithPose} from '@shared/models';

const MAX_SPEED_RATIO = 0.82;

interface TopBarProps {
  style?: React.CSSProperties;
  width: number;
  planProdRef: string;
  bobines: BobineFilleWithPose[];
  tourCount?: number;
  speed: number;
  onTourCountChange(tourCount?: number): void;
  onSpeedChange(speed: number): void;
  onSave?(): void;
  onDownload?(): void;
  isComplete: boolean;
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

  private renderButtons(): JSX.Element {
    const {isPrinting, isComplete, onDownload, onSave} = this.props;
    if (!isComplete || isPrinting) {
      return <React.Fragment />;
    }
    return (
      <ButtonsContainer>
        <Button style={{marginRight: 8}} onClick={onDownload}>
          Télécharger
        </Button>
        <Button style={{marginRight: 8}} onClick={onSave}>
          Sauvegarder
        </Button>
      </ButtonsContainer>
    );
  }

  public render(): JSX.Element {
    const {planProdRef, tourCount, speed, isPrinting, bobines, width, style = {}} = this.props;

    const productionTimeInSec =
      bobines.length > 0 && speed > 0 && tourCount && tourCount > 0
        ? this.computeProductionTime(bobines[0], speed, tourCount)
        : undefined;
    const tourCountStr = tourCount === undefined ? '' : String(tourCount);
    const bobineLength = bobines.length > 0 ? bobines[0].longueur || 0 : 0;
    const tourCountValue = tourCount || 0;
    const metrageLineaireStr = numberWithSeparator(bobineLength * tourCountValue);
    const InputClass = isPrinting ? StaticTopBarInput : TopBarInput;

    return (
      <TopBarWrapper style={{...style, width}}>
        <LeftContainer>
          <TopBarValueContainer
            style={{marginRight: 22}}
            top={<InputClass value={speed} onChange={this.handleSpeedInputChange} />}
            bottom={'M/MIN'}
          />
          <TopBarValueContainer
            style={{marginRight: 16}}
            top={<InputClass value={tourCountStr} onChange={this.handleTourCountInputChange} />}
            bottom={'TOURS'}
          />
          <TopBarValueContainer
            top={<StaticTopBarInput value={metrageLineaireStr} readOnly />}
            bottom={'MÈTRES LINÉAIRES'}
          />
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

const TopBarWrapper = styled.div`
  height: ${theme.planProd.topBarHeight}px;
  box-sizing: border-box;
  display: flex;
  padding: 0 32px;
  z-index: 100;
  background-color: ${theme.planProd.topBarBackgroundColor};
  color: ${theme.planProd.topBarTextColor};
`;

const ContainerBase = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const LeftContainer = styled.div`
  flex-basis: 1px;
  flex-grow: 1;
  display: flex;
  align-items: center;
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

const TopBarValueContainer = styled(TopBottom)`
  font-size: 12px;
  font-weight: ${FontWeight.SemiBold};
`;

const TopBarInputBase = styled(Input)`
  margin-bottom: 4px;
  width: 90px;
  height: 40px;
  font-size: 20px;
  text-align: center;
`;

const TopBarInput = styled(TopBarInputBase)``;

const StaticTopBarInput = styled(TopBarInputBase)`
  background-color: ${Palette.Transparent};
  color: ${Colors.TextOnPrimary};
`;
