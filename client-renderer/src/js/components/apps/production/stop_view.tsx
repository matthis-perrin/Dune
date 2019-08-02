import * as React from 'react';

import {StopTile} from '@root/components/apps/production/stop_tile';
import {getColorForStopType, getLabelForStopType} from '@root/lib/stop';
import {padNumber} from '@root/lib/utils';

import {Stop} from '@shared/models';

interface StopViewProps {
  stop: Stop;
  lastMinute: number;
}

export class StopView extends React.Component<StopViewProps> {
  public static displayName = 'StopView';

  public render(): JSX.Element {
    const {stop, lastMinute} = this.props;
    const duration = (stop.end || lastMinute + 60 * 1000) - stop.start;

    const hours = Math.floor(duration / (60 * 60 * 1000));
    const minutes = Math.round((duration - hours * 60 * 60 * 1000) / (60 * 1000));

    const hoursStr = padNumber(hours, 2);
    const minutesStr = padNumber(minutes, 2);

    return (
      <StopTile
        color={getColorForStopType(stop.stopType)}
        start={stop.start}
        end={stop.end}
        right={<span>{getLabelForStopType(stop.stopType)}</span>}
        indicators={[
          {
            label: 'DURÉE',
            value: `${hoursStr}h${minutesStr}`,
          },
        ]}
      />
    );
  }
}
