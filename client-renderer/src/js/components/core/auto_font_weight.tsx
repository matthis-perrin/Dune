import {omit} from 'lodash-es';
import * as React from 'react';

import {ReactProps} from '@root/components/core/common';
import {FontWeight} from '@root/theme';

interface AutoFontWeightProps
  extends ReactProps,
    React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  fontSize: number;
}

const MIN_FONT_SIZE = 11;

export class AutoFontWeight extends React.Component<AutoFontWeightProps> {
  public static displayName = 'AutoFontWeight';

  private getFontWeight(fontSize: number): number {
    // tslint:disable:no-magic-numbers
    if (fontSize <= 10) {
      return FontWeight.Black;
    }
    if (fontSize <= 12) {
      return FontWeight.Bold;
    }
    if (fontSize <= 23) {
      return FontWeight.SemiBold;
    }
    if (fontSize <= 150) {
      return FontWeight.Regular;
    }
    return FontWeight.SemiLight;
    // tslint:enable:no-magic-numbers
  }

  public render(): JSX.Element {
    const {fontSize, children} = this.props;
    const cappedFontSize = Math.max(fontSize, MIN_FONT_SIZE);
    const fontWeight = this.getFontWeight(cappedFontSize);
    const rest = omit(this.props, ['fontSize', 'children', 'style']);
    return (
      <span
        style={{
          ...this.props.style,
          fontSize: cappedFontSize,
          fontWeight,
          lineHeight: `${cappedFontSize}px`,
        }}
        {...rest}
      >
        {children}
      </span>
    );
  }
}
