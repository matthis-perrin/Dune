import * as React from 'react';
import styled from 'styled-components';

import {theme} from '@root/theme/default';

interface CaleProps {
  size: number; // Actual size of the physical cale
  pixelPerMM: number;
  height: number;
  leftBorder?: boolean;
  rightBorder?: boolean;
}

export class Cale extends React.Component<CaleProps> {
  public static displayName = 'Cale';

  public render(): JSX.Element {
    const {size, pixelPerMM, height, leftBorder} = this.props;
    const width = size * pixelPerMM;

    return (
      <CaleContainer
        leftBorder={leftBorder}
        style={{fontSize: Math.round(15 * pixelPerMM), width, height: height * pixelPerMM}}
      >
        {size}
      </CaleContainer>
    );
  }
}

const CaleContainer = styled.div<{leftBorder?: boolean; rightBorder?: boolean}>`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${theme.cale.backgroundColor};
  border-top: solid 1px ${theme.cale.borderColor};
  border-bottom: solid 1px ${theme.cale.borderColor};
  border-left: solid ${props => (props.leftBorder ? 1 : 0)}px ${theme.cale.borderColor};
  border-right: solid ${props => (props.rightBorder ? 1 : 0)}px ${theme.cale.borderColor};
`;
