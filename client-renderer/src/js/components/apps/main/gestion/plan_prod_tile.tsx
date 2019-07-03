import * as React from 'react';
import styled from 'styled-components';

import {WithColor} from '@root/components/core/with_colors';

import {PlanProductionData} from '@shared/models';

interface Props {
  data: PlanProductionData;
}

export class PlanProdTile extends React.Component<Props> {
  public static displayName = 'PlanProdTile';

  public constructor(props: Props) {
    super(props);
  }

  public render(): JSX.Element {
    const {data} = this.props;
    return (
      <WithColor color={data.papier.couleurPapier}>
        {color => (
          <TileWrapper
            style={{
              backgroundColor: color.backgroundHex,
              color: color.textHex,
              border: `solid 1px ${color.hasBorder ? color.textHex : 'transparent'}`,
            }}
          >
            {data.refente.ref}
          </TileWrapper>
        )}
      </WithColor>
    );
  }
}

const TileWrapper = styled.div`
  padding: 4px 8px;
  margin: 0 4px 4px 4px;
  border-radius: 4px;
  font-weight: 500;
`;
