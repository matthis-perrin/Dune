import {omit} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {ReactProps, DivProps} from '@root/components/core/common';
import {getCouleurByName, textColorByName, isColorWhite} from '@root/theme/default';

interface ColorProps extends ReactProps, DivProps {
  color: string;
}

export class Color extends React.Component<ColorProps> {
  public static displayName = 'Color';

  public render(): JSX.Element {
    const {color, style} = this.props;
    const backgroundColor = getCouleurByName(color);
    const textColor = textColorByName(color);

    const rest = omit(this.props, ['color', 'style']);

    return (
      <ColorWrapper
        {...rest}
        style={{
          ...style,
          backgroundColor,
          color: textColor,
          border: `solid 2px ${isColorWhite(color) ? 'black' : 'transparent'}`,
        }}
      >
        {color}
      </ColorWrapper>
    );
  }
}

const ColorWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 65px;
  height: 20px;
  font-weight: 700;
  font-size: 10px;
  border-radius: 10px;
`;
