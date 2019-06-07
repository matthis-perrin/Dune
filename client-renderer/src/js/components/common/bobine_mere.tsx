import {omit} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {HorizontalCote} from '@root/components/common/cote';
import {DivProps} from '@root/components/core/common';
import {CAPACITE_MACHINE} from '@root/lib/constants';
import {theme} from '@root/theme/default';

interface BobineMereProps extends DivProps {
  size: number;
  pixelPerMM: number;
  decalage?: number;
  borderColor?: string;
  color?: string;
  dashed?: boolean;
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
    const {color = 'white', borderColor = 'black', dashed = false} = this.props;

    const curveOffset = width * offsetRatio;
    const workingWidth = width - strokeWidth;
    const workingHeight = height - strokeWidth;
    const halfStrokeWidth = strokeWidth / 2;
    const strokeDasharray = dashed ? `${strokeWidth * 5} ${strokeWidth * 5}` : '0';

    // const leftTop = [halfStrokeWidth + curveOffset, halfStrokeWidth].join(' ');
    const leftBottom = [halfStrokeWidth + curveOffset, halfStrokeWidth + workingHeight].join(' ');
    const rightTop = [halfStrokeWidth + curveOffset + workingWidth, halfStrokeWidth].join(' ');
    // const rightBottom = [
    //   halfStrokeWidth + curveOffset + workingWidth,
    //   halfStrokeWidth + workingHeight,
    // ].join(' ');

    const startPath1 = `M${rightTop}`;
    const rightPath1 = `a ${curveOffset} ${workingHeight / 2} 0 0 0 0 ${workingHeight}`;
    const bottomPath1 = `L ${leftBottom}`;
    const leftPath1 = `a ${curveOffset} ${workingHeight / 2} 0 0 1 0 ${-workingHeight}`;
    const topPath1 = `L ${rightTop}`;

    const path1 = [startPath1, rightPath1, bottomPath1, leftPath1, topPath1].join(' ');

    const startPath2 = `M${rightTop}`;
    const ellipsePath1 = `a ${curveOffset} ${workingHeight / 2} 0 0 1 0 ${workingHeight}`;
    const ellipsePath2 = `a ${curveOffset} ${workingHeight / 2} 0 0 1 0 ${-workingHeight}`;

    const path2 = [startPath2, ellipsePath1, ellipsePath2].join(' ');

    return (
      <svg width={width * (1 + 2 * offsetRatio)} height={height}>
        <path
          d={path1}
          fill={color}
          stroke={borderColor}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
        />
        <path
          d={path2}
          fill={color}
          stroke={borderColor}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
        />
      </svg>
    );
  }

  public render(): JSX.Element {
    const {size, pixelPerMM, decalage, children, style} = this.props;
    const fullWidth = CAPACITE_MACHINE * pixelPerMM;
    const width = (size || 0) * pixelPerMM;
    const height = 80 * pixelPerMM;
    const strokeWidth = Math.round(pixelPerMM * 1.5);
    const offset = width * offsetRatio;

    const restProps = omit(this.props, [
      'ref',
      'style',
      'size',
      'pixelPerMM',
      'decalage',
      'borderColor',
      'color',
      'dashed',
      'children',
    ]);

    return (
      <BobineMereContainer
        {...restProps}
        style={{
          ...style,
          width: fullWidth + 2 * offset,
          height,
          left: strokeWidth + (decalage ? -offset : 0),
        }}
      >
        {this.draw(width, height, strokeWidth)}
        <div style={{marginRight: strokeWidth}}>{this.renderDecalage(-offset - 2, decalage)}</div>
        <ChildrenWrapper style={{right: decalage ? offset : 0}}>{children}</ChildrenWrapper>
      </BobineMereContainer>
    );
  }
}

const BobineMereContainer = styled.div`
  position: relative;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  box-sizing: border-box;
`;

const ChildrenWrapper = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;
