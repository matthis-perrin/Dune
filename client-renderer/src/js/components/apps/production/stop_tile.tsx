import * as React from 'react';
import styled from 'styled-components';

import {bridge} from '@root/lib/bridge';
import {getShortPlanProdTitle} from '@root/lib/plan_prod';
import {getColorForStopType, getLabelForStopType} from '@root/lib/stop';
import {formatDuration} from '@root/lib/utils';
import {Palette, Colors} from '@root/theme';

import {dateAtHour} from '@shared/lib/time';
import {Stop, UnplannedStop, Cleaning, Maintenance, StopType} from '@shared/models';

interface StopTileProps {
  stop: Stop;
  lastMinute: number;
  maintenances: Maintenance[];
  showBorder?: boolean;
  interactive: boolean;
}

export class StopTile extends React.Component<StopTileProps> {
  public static displayName = 'StopTile';

  private formatTime(time?: number): string {
    return time === undefined ? 'en cours' : new Date(time).toLocaleTimeString('fr');
  }

  private readonly handleClick = (): void => {
    const {stop} = this.props;
    const day = dateAtHour(new Date(stop.start), 0).getTime();
    bridge.openDayStopWindow(day, stop.start).catch(console.error);
  };

  private renderStopLine(title: string, color: string): JSX.Element {
    return (
      <StopLineWrapper style={{backgroundColor: color}}>
        <StopLineTitle>{title}</StopLineTitle>
      </StopLineWrapper>
    );
  }
  private renderType(stop: Stop): JSX.Element {
    let defaultLabel = stop.title;
    if (stop.maintenanceId !== undefined) {
      const maintenance = this.props.maintenances.find(m => m.id === stop.maintenanceId);
      if (maintenance) {
        defaultLabel = `Maintenance : ${maintenance.title}`;
      }
    }
    let label = getLabelForStopType(stop.stopType, defaultLabel);
    if (stop.stopType === StopType.ChangePlanProd || stop.stopType === StopType.ReprisePlanProd) {
      label = `${label} (plan n°${getShortPlanProdTitle(stop.planProdId || 0)})`;
    }
    return this.renderStopLine(label, getColorForStopType(stop.stopType));
  }

  private renderUnplannedStop(unplannedStop: UnplannedStop): JSX.Element {
    return this.renderStopLine(`${unplannedStop.group} : ${unplannedStop.label}`, Colors.Danger);
  }

  private renderComment(comment: string, index: number): JSX.Element {
    return this.renderStopLine(`Commentaire : ${comment}`, Palette.Asbestos);
  }

  private renderCleaning(cleaning: Cleaning): JSX.Element {
    return this.renderStopLine(`Nettoyage : ${cleaning.label}`, Palette.Asbestos);
  }
  private renderStopDetails(): JSX.Element {
    const {stop} = this.props;
    const {stopInfo} = stop;
    const unplannedStops = stopInfo ? stopInfo.unplannedStops : [];
    const comments = stopInfo ? stopInfo.comments : [];
    const cleanings = stopInfo ? stopInfo.cleanings : [];

    return (
      <React.Fragment>
        {this.renderType(stop)}
        {unplannedStops.sort((r1, r2) => r1.order - r2.order).map(r => this.renderUnplannedStop(r))}
        {comments.map((comment, index) => this.renderComment(comment, index))}
        {cleanings.sort((c1, c2) => c1.order - c2.order).map(c => this.renderCleaning(c))}
      </React.Fragment>
    );
  }

  public render(): JSX.Element {
    const {stop, lastMinute, showBorder, interactive} = this.props;

    const start = stop.start;
    const end = stop.end;
    const color = stop.stopType === undefined ? 'transparent' : getColorForStopType(stop.stopType);
    const duration = (end || lastMinute) - start;

    const additionalBorderStyles: React.CSSProperties = showBorder
      ? {
          border: `solid 1px ${color}`,
        }
      : {};

    const content = (
      <React.Fragment>
        <StopTileLeft>
          <StopTileTimes>
            <StopTileStart>
              <StopTileLabel>DÉBUT</StopTileLabel>
              <StopTileTimeValue>{this.formatTime(start)}</StopTileTimeValue>
            </StopTileStart>
            <StopTileEnd>
              <StopTileLabel>FIN</StopTileLabel>
              <StopTileTimeValue>{this.formatTime(end)}</StopTileTimeValue>
            </StopTileEnd>
          </StopTileTimes>
          <StopTileIndicator>
            <StopTileIndicatorValue>{formatDuration(duration)}</StopTileIndicatorValue>
            <StopTileLabel style={{width: 'auto'}}>DURÉE</StopTileLabel>
          </StopTileIndicator>
        </StopTileLeft>
        <StopTileRight>{this.renderStopDetails()}</StopTileRight>
      </React.Fragment>
    );

    if (interactive) {
      return (
        <StopTileWrapperWithHover
          style={{...additionalBorderStyles, borderLeft: `solid 8px ${color}`}}
          onClick={this.handleClick}
        >
          {content}
        </StopTileWrapperWithHover>
      );
    } else {
      return (
        <StopTileWrapper style={{...additionalBorderStyles, borderLeft: `solid 8px ${color}`}}>
          {content}
        </StopTileWrapper>
      );
    }
  }
}

const StopTileWrapper = styled.div`
  width: 100%;
  box-sizing: border-box;
  padding: 8px;
  display: flex;
  background-color: ${Palette.White};
`;

const StopTileWrapperWithHover = styled(StopTileWrapper)`
  &:hover {
    background: ${Palette.Clouds};
    cursor: pointer;
  }
`;

const StopTileTimes = styled.div`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  margin-right: 16px;
`;

const StopTileStart = styled.div`
  flex-grow: 1;
  flex-basis: 1px;
`;

const StopTileEnd = styled.div`
  flex-grow: 1;
  flex-basis: 1px;
`;

const StopTileLabel = styled.div`
    display: inline-block;
    width: 54px;
    font-size: 13px
    color: ${Palette.Asbestos}
`;

const StopTileTimeValue = styled.div`
  display: inline-block;
  font-size: 16px;
`;

const StopTileIndicator = styled.div`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  align-items: center;
  width: 96px;
`;

const StopTileIndicatorValue = styled.div`
  font-size: 22px;
`;

const StopTileLeft = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
`;
const StopTileRight = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
`;

const StopLineWrapper = styled.div`
  display: flex;
  align-items: center;
  margin: 4px 0;
  padding: 2px 8px;
  font-size: 14px;
`;

const StopLineTitle = styled.div`
  flex-grow: 1;
`;
