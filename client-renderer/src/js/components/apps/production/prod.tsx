import * as React from 'react';

import {Tile} from '@root/components/apps/production/tile';
import {AutoRefresh} from '@root/components/common/auto_refresh';
import {Timer} from '@root/components/common/timer';
import {getProdMetrage} from '@root/lib/prod';
import {numberWithSeparator} from '@root/lib/utils';
import {Palette} from '@root/theme';

import {Prod, MinuteSpeed} from '@shared/models';

interface ProdTileProps {
  prod: Prod;
  speeds: MinuteSpeed[];
}

interface ProdTileState {}

export class ProdTile extends React.Component<ProdTileProps, ProdTileState> {
  public static displayName = 'ProdTile';

  public constructor(props: ProdTileProps) {
    super(props);
    this.state = {};
  }

  private readonly renderProdMetrage = (): string => {
    const {prod, speeds} = this.props;
    return numberWithSeparator(Math.round(getProdMetrage(prod, speeds)));
  };

  public render(): JSX.Element {
    const {prod} = this.props;

    return (
      <Tile
        color={Palette.Nephritis}
        start={prod.start}
        end={prod.end}
        indicators={[
          {
            label: 'DURÉE',
            value: <Timer start={prod.start} end={prod.end} />,
          },
          {
            label: 'MÈTRES',
            value:
              prod.end === undefined ? (
                <AutoRefresh>{this.renderProdMetrage}</AutoRefresh>
              ) : (
                this.renderProdMetrage()
              ),
          },
        ]}
        right={<span>Right</span>}
      />
    );
  }
}
