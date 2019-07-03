import {omit} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {HTMLDivProps} from '@root/components/core/common';
import {WithColor} from '@root/components/core/with_colors';

import {PlanProductionData} from '@shared/models';

interface Props extends HTMLDivProps {
  data: PlanProductionData;
}

export class PlanProdTile extends React.Component<Props> {
  public static displayName = 'PlanProdTile';

  public constructor(props: Props) {
    super(props);
  }

  private readonly handleClick = (): void => {
    // height = width * 1.06604 + 34.25 + 32 * lines
  };

  public render(): JSX.Element {
    const {data} = this.props;
    const rest = omit(this.props, ['data', 'ref']);
    return (
      <WithColor color={data.papier.couleurPapier}>
        {color => (
          <TileWrapper
            onClick={this.handleClick}
            {...rest}
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
