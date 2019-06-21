import {omit} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {AutoFontWeight} from '@root/components/core/auto_font_weight';
import {DivProps} from '@root/components/core/common';

interface HorizontalCoteProps extends DivProps {
  size: number; // Actual size of the cote
  pixelPerMM: number;
  fontSize: number;
  textColor?: string;
  arrowColor?: string;
}

const MIN_LINE_HEIGHT = 1;
const MIN_TRIANGLE_BASE_SIZE = 3;
const MIN_TRIANGLE_HEIGHT_SIZE = 4;

const LINE_HEIGHT = 1.4;
const TRIANGLE_BASE_SIZE = 6;
const TRIANGLE_HEIGHT_SIZE = 8;

export class HorizontalCote extends React.Component<HorizontalCoteProps> {
  public static displayName = 'HorizontalCote';

  private renderTriangle(
    base: number,
    top: number,
    color: string,
    pointingLeft: boolean
  ): JSX.Element {
    const base1 = pointingLeft ? [top, 0] : [0, 0];
    const base2 = pointingLeft ? [top, base] : [0, base];
    const top1 = pointingLeft ? [0, base / 2] : [top, base / 2];

    return (
      <svg width={top} height={base}>
        <polygon points={`${base1.join(',')} ${base2.join(',')} ${top1.join(',')}`} fill={color} />
      </svg>
    );
  }

  public render(): JSX.Element {
    const {
      size,
      pixelPerMM,
      fontSize,
      arrowColor = 'black',
      textColor = 'black',
      style,
    } = this.props;
    const rest = omit(this.props, [
      'size',
      'pixelPerMM',
      'fontSize',
      'arrowColor',
      'textColor',
      'style',
    ]);
    const width = size * pixelPerMM;

    let triangleBase = Math.max(
      MIN_TRIANGLE_BASE_SIZE,
      Math.round(TRIANGLE_BASE_SIZE * pixelPerMM)
    );
    const triangleHeight = Math.max(
      MIN_TRIANGLE_HEIGHT_SIZE,
      Math.round(TRIANGLE_HEIGHT_SIZE * pixelPerMM)
    );
    const arrowLineWidth = width - 2 * triangleHeight;
    const arrowLineHeight = Math.max(MIN_LINE_HEIGHT, Math.round(LINE_HEIGHT * pixelPerMM));

    // If we want the arrow line to be aligned with the center of the triangles, we need
    // an even space on each side of the triangle base once we remove the line height.
    if ((triangleBase - arrowLineHeight) % 2 !== 0) {
      triangleBase++;
    }

    return (
      <CoteWrapper {...rest} style={{...style, width, color: textColor}}>
        <AutoFontWeight fontSize={fontSize}>{size}</AutoFontWeight>
        <ArrowWrapper>
          {this.renderTriangle(triangleBase, triangleHeight, arrowColor, true)}
          <div
            style={{width: arrowLineWidth, height: arrowLineHeight, backgroundColor: arrowColor}}
          />
          {this.renderTriangle(triangleBase, triangleHeight, arrowColor, false)}
        </ArrowWrapper>
      </CoteWrapper>
    );
  }
}

const CoteWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const ArrowWrapper = styled.div`
  display: flex;
  align-items: center;
`;
