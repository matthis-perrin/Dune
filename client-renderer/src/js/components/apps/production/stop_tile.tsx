import * as React from 'react';
import styled from 'styled-components';

import {bridge} from '@root/lib/bridge';
import {Palette} from '@root/theme';

import {dateAtHour} from '@shared/lib/time';

interface StopTileProps {
  start: number;
  end?: number;
  indicators: {label: string; value: string | JSX.Element}[];
  right: JSX.Element;
  color: string;
}

export class StopTile extends React.Component<StopTileProps> {
  public static displayName = 'StopTile';

  private formatTime(time?: number): string {
    return time === undefined ? 'en cours' : new Date(time).toLocaleTimeString('fr');
  }

  private readonly handleClick = (): void => {
    const {start} = this.props;
    const day = dateAtHour(new Date(start), 0).getTime();
    bridge.openDayStopWindow(day, start).catch(console.error);
  };

  public render(): JSX.Element {
    const {start, end, right, color, indicators} = this.props;

    return (
      <StopTileWrapper style={{borderLeftColor: color}} onClick={this.handleClick}>
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
        {indicators.map(indicator => (
          <StopTileIndicator>
            <StopTileIndicatorValue>{indicator.value}</StopTileIndicatorValue>
            <StopTileLabel style={{width: 'auto'}}>{indicator.label}</StopTileLabel>
          </StopTileIndicator>
        ))}
        <StopTileRight>{right}</StopTileRight>
      </StopTileWrapper>
    );
  }
}

const StopTileWrapper = styled.div`
  width: 100%;
  box-sizing: border-box;
  border-left: solid 8px;
  padding: 8px;
  display: flex;
  background-color: ${Palette.White};
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

const StopTileRight = styled.div`
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;
