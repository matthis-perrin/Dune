import * as React from 'react';

import {Tile} from '@root/components/apps/production/tile';
import {Palette} from '@root/theme';

import {Prod} from '@shared/models';

interface ProdTileProps {
  prod: Prod;
}

interface ProdTileState {}

export class ProdTile extends React.Component<ProdTileProps, ProdTileState> {
  public static displayName = 'ProdTile';

  public constructor(props: ProdTileProps) {
    super(props);
    this.state = {};
  }

  public render(): JSX.Element {
    const {prod} = this.props;

    return (
      <Tile
        color={Palette.Nephritis}
        start={prod.start}
        end={prod.end}
        right={<span>Right</span>}
      />
    );
  }
}
