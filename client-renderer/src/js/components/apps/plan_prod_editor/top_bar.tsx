import {max} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {Duration} from '@root/components/common/duration';
import {Button} from '@root/components/core/button';
import {Input} from '@root/components/core/input';
import {TopBottom} from '@root/components/core/top_bottom';
import {
  computeProductionTime,
  getMetrageLineaire,
  getBobineMereConsumption,
} from '@root/lib/plan_prod';
import {getOperationTime} from '@root/lib/plan_prod_operation';
import {
  getPreviousSchedule,
  getPlanProd,
  getPlanStart,
  getPlanEnd,
  getProdTime,
} from '@root/lib/schedule_utils';
import {
  getStockReel,
  getStockTerme,
  getStockReelPrevisionel,
  getStockTermePrevisionel,
} from '@root/lib/stocks';
import {numberWithSeparator, roundedToDigit, formatPlanDate} from '@root/lib/utils';
import {theme, Palette, FontWeight, Colors} from '@root/theme';

import {EncrierColor} from '@shared/lib/encrier';
import {
  BobineFilleWithPose,
  BobineMere,
  Stock,
  PlanProductionInfo,
  Operation,
  Perfo,
  Refente,
  Schedule,
} from '@shared/models';

interface TopBarProps {
  style?: React.CSSProperties;
  width: number;
  planProdTitle: string;
  bobines: BobineFilleWithPose[];
  papier?: BobineMere;
  polypro?: BobineMere;
  tourCount?: number;
  speed: number;
  onTourCountChange(tourCount?: number): void;
  onSpeedChange(speed: number): void;
  onSave?(): void;
  onDownload?(): void;
  onClear?(): void;
  isComplete: boolean;
  isPrinting: boolean;
  stocks: Map<string, Stock[]>;
  planId: number;
  planProdInfo: PlanProductionInfo;
  schedule?: Schedule;
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

  private readonly renderButtons = (): JSX.Element => {
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
        {isComplete ? (
          <Button style={{marginRight: 8}} onClick={onSave}>
            Sauvegarder
          </Button>
        ) : (
          <React.Fragment />
        )}
      </ButtonsContainer>
    );
  };

  private getAlert(bobineMere: BobineMere | undefined, type: string): JSX.Element | undefined {
    if (!bobineMere) {
      return undefined;
    }
    const {ref, longueur = 0} = bobineMere;
    const {stocks, bobines, schedule, planProdInfo, tourCount = 0} = this.props;

    const longueurBobineFille = bobines.length > 0 ? bobines[0].longueur || 0 : 0;
    const prod = longueur !== 0 ? (tourCount * longueurBobineFille) / longueur : 0;

    const stockReel = getStockReel(ref, stocks);
    const stockTerme = getStockTerme(ref, stocks);
    const stockPrevisionelReel =
      schedule && getStockReelPrevisionel(ref, stocks, schedule, planProdInfo);
    const stockPrevisionelReelTerme =
      schedule && getStockTermePrevisionel(ref, stocks, schedule, planProdInfo);

    const stockActuel = stockReel;
    const stockActuelTerme = stockTerme;
    const stockPrevisionel = stockPrevisionelReel;
    const stockPrevisionelTerme = stockPrevisionelReelTerme;
    const stockAfterProd = stockReel - prod;
    const stockAfterProdTerme = stockTerme - prod;

    const label = `${type} ${bobineMere.ref}`;
    const withDecimal = (value: number): number => Math.round(value * 10) / 10;

    let message: string | undefined;
    if (stockActuel < 0) {
      const value = withDecimal(stockActuel);
      message = `Le stock actuel du ${label} est négatif (${value}) !`;
    } else if (stockPrevisionel && stockPrevisionel < 0) {
      const value = withDecimal(stockPrevisionel);
      message = `Le stock prévisionel du ${label} est négatif (${value}) !`;
    } else if (stockAfterProd < 0) {
      const value = withDecimal(stockAfterProd);
      message = `Le stock du ${label} après production est négatif (${value}) !`;
    } else if (stockActuelTerme < 0) {
      const value = withDecimal(stockActuelTerme);
      message = `Le stock actuel à terme du ${label} est négatif (${value}) !`;
    } else if (stockPrevisionelTerme && stockPrevisionelTerme < 0) {
      const value = withDecimal(stockPrevisionelTerme);
      message = `Le stock prévisionel à terme du ${label} est négatif (${value}) !`;
    } else if (stockAfterProdTerme < 0) {
      const value = withDecimal(stockAfterProdTerme);
      message = `Le stock du ${label} après production à terme est négatif (${value}) !`;
    }
    return message ? <div>{message}</div> : undefined;
  }

  public render(): JSX.Element {
    const {
      tourCount,
      speed,
      isPrinting,
      planProdTitle,
      bobines,
      width,
      papier,
      polypro,
      schedule,
      planId,
      style = {},
    } = this.props;

    const papierAlert = this.getAlert(papier, 'papier');
    const polyproAlert = this.getAlert(polypro, 'polypro');
    const alerts =
      papierAlert || polyproAlert ? (
        <AlertContainer>
          {papierAlert}
          {polyproAlert}
        </AlertContainer>
      ) : (
        <React.Fragment />
      );

    let start: number | undefined;
    let end: number | undefined;
    let prodTime: number | undefined;
    let operationTime: number | undefined;
    if (schedule) {
      const planSchedule = getPlanProd(schedule, planId);
      if (planSchedule) {
        start = getPlanStart(planSchedule);
        end = getPlanEnd(planSchedule);
        prodTime = getProdTime(planSchedule);
        const {aideConducteur, conducteur, chauffePerfo, chauffeRefente} = planSchedule.operations;
        operationTime =
          max(
            [aideConducteur, conducteur, chauffePerfo, chauffeRefente].map(split => split.total)
          ) || 0;
      }
    }

    return (
      <React.Fragment>
        <TopBarView
          style={style}
          width={width}
          planProdTitle={planProdTitle}
          bobines={bobines}
          papier={papier}
          tourCount={tourCount}
          speed={speed}
          onTourCountInputChange={this.handleTourCountInputChange}
          onSpeedInputChange={this.handleSpeedInputChange}
          isPrinting={isPrinting}
          renderButtons={this.renderButtons}
          start={start}
          end={end}
          prodTime={prodTime}
          operationTime={operationTime}
        />
        {alerts}
      </React.Fragment>
    );
  }
}

interface TopBarViewProps {
  style?: React.CSSProperties;
  width: number;
  planProdTitle: string;
  bobines: BobineFilleWithPose[];
  papier?: BobineMere;
  tourCount?: number;
  speed: number;
  onTourCountInputChange?: React.ChangeEventHandler<HTMLInputElement>;
  onSpeedInputChange?: React.ChangeEventHandler<HTMLInputElement>;
  isPrinting: boolean;
  renderButtons?(): JSX.Element;
  start?: number;
  end?: number;
  prodTime?: number;
  operationTime?: number;
}

export class TopBarView extends React.Component<TopBarViewProps> {
  public static displayName = 'TopBarView';

  public render(): JSX.Element {
    const {
      tourCount,
      speed,
      isPrinting,
      planProdTitle,
      bobines,
      width,
      papier,
      start,
      end,
      prodTime,
      operationTime,
      style = {},
      renderButtons = () => <React.Fragment />,
      onTourCountInputChange,
      onSpeedInputChange,
    } = this.props;

    const tourCountStr = tourCount === undefined ? '' : String(tourCount);
    const metrageLineaireStr = numberWithSeparator(getMetrageLineaire({bobines, tourCount}));
    const InputClass = isPrinting ? StaticTopBarInput : TopBarInput;

    const prod = getBobineMereConsumption({bobines, papier, tourCount});

    const tourCountStyles = isPrinting
      ? {
          fontSize: 26,
          fontWeight: FontWeight.SemiBold,
          backgroundColor: Palette.White,
          borderWidth: 3,
          color: Colors.SecondaryDark,
        }
      : {};

    return (
      <TopBarWrapper style={{...style, width}}>
        <LeftContainer>
          <TopBarTitle>{planProdTitle}</TopBarTitle>
          {renderButtons()}
        </LeftContainer>
        <CenterContainer>
          <TopBarValueContainer
            style={{marginRight: 16}}
            top={<StaticTopBarInput value={metrageLineaireStr} readOnly />}
            bottom={'MÈTRES LINÉAIRES'}
          />
          <TopBarValueContainer
            style={{marginRight: 16}}
            top={<StaticTopBarInput value={roundedToDigit(prod, 1)} readOnly />}
            bottom={'CONSO BOBINES MÈRES'}
          />
          <TopBarValueContainer
            style={{marginRight: 16}}
            top={
              <InputClass
                style={tourCountStyles}
                value={tourCountStr}
                onChange={onTourCountInputChange}
              />
            }
            bottom={'TOURS'}
          />
          <TopBarValueContainer
            style={{marginRight: 16}}
            top={<InputClass value={speed} onChange={onSpeedInputChange} />}
            bottom={'M/MIN'}
          />
        </CenterContainer>
        <RightContainer>
          <span>{`Début : ${formatPlanDate(start)}`}</span>
          <span>
            Réglage: <Duration durationMs={operationTime ? operationTime * 1000 : undefined} />
          </span>
          <span>
            Production: <Duration durationMs={prodTime} />
          </span>
          <span>{`Fin : ${formatPlanDate(end)}`}</span>
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
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
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
  width: 93px;
  height: 40px;
  font-size: 20px;
  text-align: center;
`;

const TopBarInput = styled(TopBarInputBase)``;

const StaticTopBarInput = styled(TopBarInputBase)`
  background-color: ${Palette.Transparent};
  color: ${Colors.TextOnPrimary};
`;

const AlertContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  background-color: ${Colors.Danger};
  color: ${Palette.White};
  font-weight: ${FontWeight.SemiBold};
  padding: 16px 32px;
`;
