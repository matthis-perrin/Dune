import {omit} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {HorizontalCote} from '@root/components/common/cote';
import {DivProps} from '@root/components/core/common';
import {CAPACITE_MACHINE} from '@root/lib/constants';
import {theme} from '@root/theme/default';

interface BobineProps extends DivProps {
  size: number;
  pixelPerMM: number;
  decalage?: number;
  borderColor?: string;
  color?: string;
  dashed?: boolean;
  faceDown?: boolean;
}

export const CURVE_EXTRA_SPACE = 0.01;
export const SHEET_EXTRA_HEIGHT = 0.2;
export const BOBINE_STROKE_WIDTH = 2;

export class Bobine extends React.Component<BobineProps> {
  public static displayName = 'Bobine';

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

  private draw(
    width: number,
    height: number,
    curveOffset: number,
    sheetExtraHeight: number,
    faceDown?: boolean
  ): JSX.Element {
    const {color = 'white', borderColor = 'black', dashed = false} = this.props;
    const workingWidth = width - BOBINE_STROKE_WIDTH;
    const workingHeight = height - BOBINE_STROKE_WIDTH - sheetExtraHeight;
    const halfStrokeWidth = BOBINE_STROKE_WIDTH / 2;
    const strokeDasharray = dashed ? `${BOBINE_STROKE_WIDTH * 2} ${BOBINE_STROKE_WIDTH * 3}` : '0';

    const leftBottom = [
      halfStrokeWidth + curveOffset,
      halfStrokeWidth + sheetExtraHeight + workingHeight,
    ].join(' ');
    const rightTop = [
      halfStrokeWidth + workingWidth + curveOffset,
      halfStrokeWidth + sheetExtraHeight,
    ].join(' ');

    const leftTopRectangle = [halfStrokeWidth + 2 * curveOffset, halfStrokeWidth].join(' ');
    const leftMiddleRectangle = [
      halfStrokeWidth + 2 * curveOffset,
      halfStrokeWidth + sheetExtraHeight + workingHeight / 2,
    ].join(' ');
    const rightTopRectangle = [
      halfStrokeWidth + 2 * curveOffset + workingWidth,
      halfStrokeWidth,
    ].join(' ');
    const rightMiddleRectangle = [
      halfStrokeWidth + 2 * curveOffset + workingWidth,
      halfStrokeWidth + sheetExtraHeight + workingHeight / 2,
    ].join(' ');
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

    const startRectangle = `M${rightTopRectangle}`;
    const leftRectangle = `L ${rightMiddleRectangle}`;
    const bottomRectangle = `L ${leftMiddleRectangle}`;
    const rightRectangle = `L ${leftTopRectangle}`;
    const topRectangle = `L ${rightTopRectangle}`;
    const rectanglePath = [
      startRectangle,
      leftRectangle,
      bottomRectangle,
      rightRectangle,
      topRectangle,
    ].join(' ');

    const commonDrawingProps = {
      fill: color,
      stroke: borderColor,
      strokeWidth: BOBINE_STROKE_WIDTH,
      strokeDasharray,
      strokeLinecap: 'square' as 'square',
    };

    const svgProps: React.SVGProps<SVGSVGElement> = {
      width: width + 2 * curveOffset,
      height,
    };
    if (faceDown) {
      svgProps.transform = 'scale(1, -1)';
    }

    return (
      <svg {...svgProps}>
        <path d={rectanglePath} {...commonDrawingProps} />
        <path d={path1} {...commonDrawingProps} />
        <path d={path2} {...commonDrawingProps} />
      </svg>
    );
  }

  public render(): JSX.Element {
    const {size, pixelPerMM, decalage, children, style, faceDown} = this.props;
    const decalageSize = (decalage || 0) * pixelPerMM;
    const width = (size || 0) * pixelPerMM;
    const height = 100 * pixelPerMM;
    const offset = CAPACITE_MACHINE * CURVE_EXTRA_SPACE * pixelPerMM;
    const sheetExtraHeight = height * SHEET_EXTRA_HEIGHT;

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
      <BobineContainer
        {...restProps}
        style={{
          ...style,
          width: width + decalageSize + 2 * offset + BOBINE_STROKE_WIDTH,
          height,
          left: BOBINE_STROKE_WIDTH,
        }}
      >
        {this.draw(width, height, offset, sheetExtraHeight, faceDown)}
        <div style={{marginRight: BOBINE_STROKE_WIDTH}}>{this.renderDecalage(-2, decalage)}</div>
        <ChildrenWrapper
          style={{
            width,
            right: decalageSize + 2 * offset,
            top: faceDown ? -sheetExtraHeight : sheetExtraHeight,
          }}
        >
          {children}
        </ChildrenWrapper>
      </BobineContainer>
    );
  }
}

const BobineContainer = styled.div`
  position: relative;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  box-sizing: border-box;
`;

const ChildrenWrapper = styled.div`
  position: absolute;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;
