import {range} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {HorizontalCote} from '@root/components/common/cote';
import {AutoFontWeight} from '@root/components/core/auto_font_weight';
import {CAPACITE_MACHINE} from '@root/lib/constants';
import {theme} from '@root/theme/default';

import {BobineMere as BobineMereModel} from '@shared/models';

interface BobineMereProps {
  bobineMere: BobineMereModel;
  pixelPerMM: number;
  decalage?: number;
  color: string;
}

const offsetRatio = 0.02;

export class BobineMere extends React.Component<BobineMereProps> {
  public static displayName = 'BobineMere';

  private renderDecalage(offset: number, decalage?: number): JSX.Element {
    const {pixelPerMM} = this.props;
    if (!decalage) {
      return <React.Fragment />;
    }
    return (
      <div style={{marginLeft: offset}}>
        <HorizontalCote
          fontSize={theme.refente.baseFontSize * pixelPerMM}
          size={decalage}
          pixelPerMM={pixelPerMM}
        />
      </div>
    );
  }

  private draw(width: number, height: number, strokeWidth: number): JSX.Element {
    const {color} = this.props;

    const curveOffset = width * offsetRatio;
    const workingWidth = width - strokeWidth;
    const workingHeight = height - strokeWidth;
    const halfStrokeWidth = strokeWidth / 2;

    const leftTop = [halfStrokeWidth + curveOffset, halfStrokeWidth].join(' ');
    const rightTop = [halfStrokeWidth + curveOffset + workingWidth, halfStrokeWidth].join(' ');
    const rightBottom = [
      halfStrokeWidth + curveOffset + workingWidth,
      halfStrokeWidth + workingHeight,
    ].join(' ');

    const startPath1 = `M${leftTop}`;
    const leftPath1 = `a ${curveOffset} ${workingHeight / 2} 0 0 0 0 ${workingHeight}`;
    const bottomPath1 = `L ${rightBottom}`;
    const rightPath1 = `a ${curveOffset} ${workingHeight / 2} 0 0 1 0 ${-workingHeight}`;
    const topPath1 = `L ${leftTop}`;

    const path1 = [startPath1, leftPath1, bottomPath1, rightPath1, topPath1].join(' ');

    const startPath2 = `M${rightTop}`;
    const ellipsePath1 = `a ${curveOffset} ${workingHeight / 2} 0 0 1 0 ${workingHeight}`;
    const ellipsePath2 = `a ${curveOffset} ${workingHeight / 2} 0 0 1 0 ${-workingHeight}`;

    const path2 = [startPath2, ellipsePath1, ellipsePath2].join(' ');

    return (
      <svg width={width * (1 + 2 * offsetRatio)} height={height}>
        <path d={path1} fill={color} stroke="black" strokeWidth={strokeWidth} />
        <path d={path2} fill={color} stroke="black" strokeWidth={strokeWidth} />
      </svg>
    );
  }

  public render(): JSX.Element {
    const {bobineMere, pixelPerMM, decalage} = this.props;
    const fullWidth = CAPACITE_MACHINE * pixelPerMM;
    const width = (bobineMere.laize || 0) * pixelPerMM;
    const height = 80 * pixelPerMM;
    const strokeWidth = Math.round(pixelPerMM * 1.5);
    const offset = width * offsetRatio;

    return (
      <BobineMereContainer
        style={{
          width: fullWidth + 2 * offset,
          height,
          left: strokeWidth + (decalage ? -offset : 0),
        }}
      >
        <BobineWrapper>{this.draw(width, height, strokeWidth)}</BobineWrapper>
        <div style={{marginRight: strokeWidth}}>{this.renderDecalage(-offset - 2, decalage)}</div>
      </BobineMereContainer>
    );
  }
}

const BobineMereContainer = styled.div`
  position: relative;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  background-color: #bbbbff;
`;

const BobineWrapper = styled.div``;
