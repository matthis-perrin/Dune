import * as React from 'react';

import {StopTile} from '@root/components/apps/production/stop_tile';
import {Timer} from '@root/components/common/timer';
import {Palette} from '@root/theme';

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
        color={Palette.Alizarin}
        start={stop.start}
        end={stop.end}
        right={<span>Right</span>}
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
