import * as React from 'react';
import styled from 'styled-components';

import {Duration} from '@root/components/common/duration';
import {Button} from '@root/components/core/button';
import {Input} from '@root/components/core/input';
import {TopBottom} from '@root/components/core/top_bottom';
import {numberWithSeparator} from '@root/lib/utils';
import {theme, Palette, FontWeight, Colors} from '@root/theme';

import {BobineFilleWithPose, BobineMere} from '@shared/models';

const MAX_SPEED_RATIO = 0.82;

interface TopBarProps {
  style?: React.CSSProperties;
  width: number;
  planProdTitle: string;
  bobines: BobineFilleWithPose[];
  papier?: BobineMere;
  tourCount?: number;
  speed: number;
  onTourCountChange(tourCount?: number): void;
  onSpeedChange(speed: number): void;
  onSave?(): void;
  onDownload?(): void;
  onClear?(): void;
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
    const {isPrinting, isComplete, onDownload, onSave, onClear} = this.props;

    if (isPrinting) {
      return <React.Fragment />;
    }
    return (
      <ButtonsContainer>
        {isComplete ? (
          <Button style={{marginRight: 8}} onClick={onDownload}>
            Télécharger
          </Button>
        ) : (
          <React.Fragment />
        )}
        <Button style={{marginRight: 8}} onClick={onClear}>
          Effacer
        </Button>
        <Button style={{marginRight: 8}} onClick={onSave}>
          Sauvegarder
        </Button>
      </ButtonsContainer>
    );
  }

  public render(): JSX.Element {
    const {tourCount, speed, isPrinting, bobines, width, papier, style = {}} = this.props;

    const productionTimeInSec =
      bobines.length > 0 && speed > 0 && tourCount && tourCount > 0
        ? this.computeProductionTime(bobines[0], speed, tourCount)
        : undefined;
    const tourCountStr = tourCount === undefined ? '' : String(tourCount);
    const bobineLength = bobines.length > 0 ? bobines[0].longueur || 0 : 0;
    const tourCountValue = tourCount || 0;
    const metrageLineaireStr = numberWithSeparator(bobineLength * tourCountValue);
    const InputClass = isPrinting ? StaticTopBarInput : TopBarInput;

    const longueur = papier ? papier.longueur || 0 : 0;
    const longueurBobineFille = bobines.length > 0 ? bobines[0].longueur || 0 : 0;
    const prod =
      Math.round((longueur !== 0 ? (tourCountValue * longueurBobineFille) / longueur : 0) * 10) /
      10;

    const tourCountStyles = isPrinting
      ? {
          fontSize: 26,
          fontWeight: FontWeight.Bold,
          backgroundColor: Palette.White,
          borderWidth: 2,
          color: Palette.Black,
        }
      : {};

    return (
      <TopBarWrapper style={{...style, width}}>
        <LeftContainer>
          <TopBarTitle>PRODUCTION 00013</TopBarTitle>
          {this.renderButtons()}
        </LeftContainer>
        <CenterContainer>
          <TopBarValueContainer
            style={{marginRight: 16}}
            top={<StaticTopBarInput value={metrageLineaireStr} readOnly />}
            bottom={'MÈTRES LINÉAIRES'}
          />
          <TopBarValueContainer
            style={{marginRight: 16}}
            top={<StaticTopBarInput value={prod} readOnly />}
            bottom={'CONSO BOBINES MÈRES'}
          />
          <TopBarValueContainer
            style={{marginRight: 16}}
            top={
              <InputClass
                style={tourCountStyles}
                value={tourCountStr}
                onChange={this.handleTourCountInputChange}
              />
            }
            bottom={'TOURS'}
          />
          <TopBarValueContainer
            style={{marginRight: 16}}
            top={<InputClass value={speed} onChange={this.handleSpeedInputChange} />}
            bottom={'M/MIN'}
          />
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

const LeftContainer = styled(ContainerBase)`
  flex-grow: 1;
  justify-content: space-evenly;
`;

const RightContainer = styled(ContainerBase)`
  flex-shrink: 0;
  font-size: ${theme.planProd.topBarDetailsFontSize}px;
`;

const CenterContainer = styled.div`
  display: flex;
  align-items: center;
  align-items: center;
  flex-shrink: 0;
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
