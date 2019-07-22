import * as React from 'react';
import styled from 'styled-components';

import {Timer} from '@root/components/common/timer';
import {Palette} from '@root/theme';

interface TileProps {
  start: number;
  end?: number;
  right: JSX.Element;
  color: string;
}

export class Tile extends React.Component<TileProps> {
  public static displayName = 'Tile';

  private formatTime(time?: number): string {
    return time === undefined ? 'en cours' : new Date(time).toLocaleTimeString('fr');
  }

  public render(): JSX.Element {
    const {start, end, right, color} = this.props;

    return (
      <TileWrapper style={{borderLeftColor: color}}>
        <TileTimes>
          <TileStart>
            <TileLabel>DÉBUT</TileLabel>
            <TileTimeValue>{this.formatTime(start)}</TileTimeValue>
          </TileStart>
          <TileEnd>
            <TileLabel>FIN</TileLabel>
            <TileTimeValue>{this.formatTime(end)}</TileTimeValue>
          </TileEnd>
        </TileTimes>
        <TileDuration>
          <TileDurationValue>{<Timer start={start} end={end} />}</TileDurationValue>
          <TileLabel style={{width: 'auto'}}>DURÉE</TileLabel>
        </TileDuration>
        <TileRight>{right}</TileRight>
      </TileWrapper>
    );
  }
}

const TileWrapper = styled.div`
  border-left: solid 8px;
  padding: 8px;
  display: flex;
  background-color: ${Palette.White};
  margin: 4px 4px 0 4px;
`;

const TileTimes = styled.div`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  margin-right: 16px;
`;

const TileStart = styled.div`
  flex-grow: 1;
  flex-basis: 1px;
`;

const TileEnd = styled.div`
  flex-grow: 1;
  flex-basis: 1px;
`;

const TileLabel = styled.div`
    display: inline-block;
    width: 48px;
    font-size: 13px
    color: ${Palette.Asbestos}
`;

const TileTimeValue = styled.div`
  display: inline-block;
  font-size: 16px;
`;

const TileDuration = styled.div`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  align-items: center;
  width: 96px;
`;

const TileDurationValue = styled.div`
  font-size: 22px;
`;

const TileRight = styled.div`
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;
