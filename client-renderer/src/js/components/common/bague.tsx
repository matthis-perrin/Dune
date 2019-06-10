import {range} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {AutoFontWeight} from '@root/components/core/auto_font_weight';
import {theme} from '@root/theme/default';

interface BagueProps {
  size: number; // Actual size of the physical bague
  pixelPerMM: number;
  height: number;
}

export class Bague extends React.Component<BagueProps> {
  public static displayName = 'Bague';

  private renderTriangle(
    key: string,
    width: number,
    height: number,
    pointingUp: boolean
  ): JSX.Element {
    const base1 = pointingUp ? [0, height] : [0, 0];
    const base2 = pointingUp ? [width, height] : [width, 0];
    const top = pointingUp ? [width / 2, 0] : [width / 2, height];

    return (
      <svg key={key} width={width} height={height}>
        <polygon
          points={`${base1.join(',')} ${base2.join(',')} ${top.join(',')}`}
          fill={theme.bague.backgroundColor}
          stroke={theme.bague.borderColor}
        />
      </svg>
    );
  }

  public render(): JSX.Element {
    const {size, pixelPerMM, height} = this.props;
    const width = size * pixelPerMM;
    const triangleCount = Math.round(width / (theme.bague.baseTriangleHeight * pixelPerMM));
    const triangleWidth = width / triangleCount;
    const triangleHeight = triangleWidth + 1;
    return (
      <BagueContainer style={{width}}>
        <TrianglesContainer>
          {range(triangleCount).map(index =>
            this.renderTriangle(`tri-${index}`, triangleWidth, triangleHeight, true)
          )}
        </TrianglesContainer>
        <BagueInner
          fontSize={Math.round(theme.bague.baseFontSize * pixelPerMM)}
          style={{height: height * pixelPerMM - 2 * triangleHeight}}
        >
          {size}
        </BagueInner>
        <TrianglesContainer>
          {range(triangleCount).map(index =>
            this.renderTriangle(`tri-${index}`, triangleWidth, triangleHeight, false)
          )}
        </TrianglesContainer>
      </BagueContainer>
    );
  }
}

const BagueContainer = styled.div``;
const TrianglesContainer = styled.div`
  display: flex;
`;
const BagueInner = styled(AutoFontWeight)`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${theme.bague.backgroundColor};
  border-left: solid 1px ${theme.bague.borderColor};
  border-right: solid 1px ${theme.bague.borderColor};
`;
