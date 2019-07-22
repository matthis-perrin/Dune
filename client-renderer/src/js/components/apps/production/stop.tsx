import * as React from 'react';

import {Tile} from '@root/components/apps/production/tile';
import {Timer} from '@root/components/common/timer';
import {Palette} from '@root/theme';

import {Stop} from '@shared/models';

interface StopTileProps {
  stop: Stop;
}

interface StopTileState {}

export class StopTile extends React.Component<StopTileProps, StopTileState> {
  public static displayName = 'StopTile';

  public constructor(props: StopTileProps) {
    super(props);
    this.state = {};
  }

  public render(): JSX.Element {
    const {stop} = this.props;

    return (
      <Tile
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
