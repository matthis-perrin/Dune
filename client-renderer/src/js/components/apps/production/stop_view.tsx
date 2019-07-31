import * as React from 'react';

import {StopTile} from '@root/components/apps/production/stop_tile';
import {Timer} from '@root/components/common/timer';
import {getColorForStopType} from '@root/lib/stop';

import {Stop} from '@shared/models';

interface StopViewProps {
  stop: Stop;
}

interface StopViewState {}

export class StopView extends React.Component<StopViewProps, StopViewState> {
  public static displayName = 'StopView';

  public constructor(props: StopViewProps) {
    super(props);
    this.state = {};
  }

  public render(): JSX.Element {
    const {stop} = this.props;

    return (
      <StopTile
        color={getColorForStopType(stop.stopType)}
        start={stop.start}
        end={stop.end}
        right={<span>{stop.stopType || '???'}</span>}
        indicators={[
          {
            label: 'DURÉE',
            value: <Timer start={stop.start} end={stop.end} />,
          },
        ]}
      />
    );
  }
}
