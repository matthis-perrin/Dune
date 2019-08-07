import * as React from 'react';

import {StopTile} from '@root/components/apps/production/stop_tile';
import {getColorForStopType, getLabelForStopType} from '@root/lib/stop';
import {formatDuration} from '@root/lib/utils';

import {Stop} from '@shared/models';

interface StopViewProps {
  stop: Stop;
  lastMinute: number;
}

export class StopView extends React.Component<StopViewProps> {
  public static displayName = 'StopView';

  public render(): JSX.Element {
    const {stop, lastMinute} = this.props;
    const duration = (stop.end || lastMinute) - stop.start;

    return (
      <StopTile
        color={getColorForStopType(stop.stopType)}
        start={stop.start}
        end={stop.end}
        right={<span>{getLabelForStopType(stop.stopType)}</span>}
        indicators={[
          {
            label: 'DURÉE',
            value: formatDuration(duration),
          },
        ]}
      />
    );
  }
}
