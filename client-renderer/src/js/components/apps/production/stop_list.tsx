import * as React from 'react';
import styled from 'styled-components';

import {StopView} from '@root/components/apps/production/stop_view';
import {Button} from '@root/components/core/button';
import {bridge} from '@root/lib/bridge';

import {Stop} from '@shared/models';

interface StopListProps {
  stops: Stop[];
  lastMinute: number;
}

export class StopList extends React.Component<StopListProps> {
  public static displayName = 'StopList';

  private readonly handleNewStopClick = (): void => {
    const {lastMinute, stops} = this.props;
    const lastStop = stops[0];
    if (lastStop) {
      bridge.createStop(lastStop.start, lastMinute);
    }
  };

  private canCreateNewStop(): boolean {
    const {lastMinute, stops} = this.props;
    const lastStop = stops[0];
    return lastStop !== undefined && lastStop.end === undefined && lastStop.start !== lastMinute;
  }

  public render(): JSX.Element {
    const {stops, lastMinute} = this.props;
    return (
      <StopsWrapper>
        <Button onClick={this.handleNewStopClick} disabled={!this.canCreateNewStop()}>
          Nouvel Arrêt
        </Button>
        {stops.map(s => (
          <StopView lastMinute={lastMinute} stop={s} />
        ))}
      </StopsWrapper>
    );
  }
}

const StopsWrapper = styled.div``;
