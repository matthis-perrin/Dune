import * as React from 'react';
import styled from 'styled-components';

import {AutoFontWeight} from '@root/components/core/auto_font_weight';
import {theme} from '@root/theme';

interface CaleProps {
  size: number; // Actual size of the physical cale
  pixelPerMM: number;
  leftBorder?: boolean;
  rightBorder?: boolean;
}

const CALE_HEIGHT_RATIO = 0.3;

export class Cale extends React.Component<CaleProps> {
  public static displayName = 'Cale';

  public render(): JSX.Element {
    const {size, pixelPerMM, leftBorder, rightBorder} = this.props;
    const width = size * pixelPerMM;

    return (
      <CaleContainer
        fontSize={theme.planProd.elementsBaseMediumFontSize * pixelPerMM}
        style={{
          width,
          height: theme.planProd.elementsBaseHeight * CALE_HEIGHT_RATIO * pixelPerMM,
          borderLeft: `solid ${leftBorder ? 1 : 0}px ${theme.cale.borderColor}`,
          borderRight: `solid ${rightBorder ? 1 : 0}px ${theme.cale.borderColor}`,
        }}
      >
        {size}
      </CaleContainer>
    );
  }
}

const CaleContainer = styled(AutoFontWeight)`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${theme.cale.backgroundColor};
  border-top: solid 1px ${theme.cale.borderColor};
  border-bottom: solid 1px ${theme.cale.borderColor};
`;
