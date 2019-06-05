import {omit} from 'lodash-es';
import * as React from 'react';

import {ReactProps} from '@root/components/core/common';

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
      return 700;
    }
    if (fontSize <= 16) {
      return 600;
    }
    if (fontSize <= 28) {
      return 400;
    }
    return 300;
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
