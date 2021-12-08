import {omit} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {ReactProps, DivProps} from '@root/components/core/common';
import {WithColor} from '@root/components/core/with_colors';

interface ColorProps extends ReactProps, DivProps {
  color: string;
}

export class Color extends React.Component<ColorProps> {
  public static displayName = 'Color';

  public render(): JSX.Element {
    const {color, style} = this.props;

    const rest = omit(this.props, ['data', 'style']);

    return (
      <WithColor color={color}>
        {colorData => (
          <ColorWrapper
            {...rest}
            style={{
              ...style,
              backgroundColor: colorData.backgroundHex,
              color: colorData.textHex,
              border: `solid 1px ${colorData.hasBorder ? colorData.textHex : 'transparent'}`,
            }}
          >
            {colorData.name}
          </ColorWrapper>
        )}
      </WithColor>
    );
  }
}

const ColorWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 75px;
  height: 20px;
  font-weight: 700;
  font-size: 10px;
  border-radius: 10px;
`;
