import {omit} from 'lodash-es';
import React from 'react';
import styled from 'styled-components';

import {Color} from '@root/components/common/color';
import {DivProps} from '@root/components/core/common';
import {SVGIcon} from '@root/components/core/svg_icon';

import {BobineColors as BobineColorsModel, ClicheColor} from '@shared/lib/encrier';

interface BobineColorsProps extends DivProps {
  bobineColors: BobineColorsModel;
}

export class BobineColors extends React.Component<BobineColorsProps> {
  public static displayName = 'BobineColors';

  private renderColorLink(index: number): JSX.Element {
    return <LinkIcon key={`link-${index}`} name="link" width={16} height={16} />;
  }

  private renderColorPadding(index: number): JSX.Element {
    return <Padding key={`padding-${index}`} />;
  }

  private renderOrderedColors(colors: ClicheColor[]): JSX.Element[] {
    const elements: JSX.Element[] = [];
    colors.forEach((c, i) => {
      elements.push(<Color key={`ordered-${c}-${i}`} color={c.color} />);
      elements.push(this.renderColorLink(i));
    });
    if (elements.length > 0) {
      elements.pop();
    }
    return elements;
  }

  public render(): JSX.Element {
    const {bobineColors} = this.props;
    let elements: JSX.Element[] = [];
    let paddingIndex = 0;
    if (bobineColors.ordered.length > 0) {
      elements = elements.concat(this.renderOrderedColors(bobineColors.ordered));
      elements.push(this.renderColorPadding(paddingIndex++));
    }
    bobineColors.nonOrdered.forEach((c, i) => {
      elements.push(<Color key={`non-ordered-${c}-${i}`} color={c.color} />);
      elements.push(this.renderColorPadding(paddingIndex++));
    });
    if (elements.length > 0) {
      elements.pop();
    }
    const rest = omit(this.props, ['bobineColors']);
    return <BobineColorsWrapper {...rest}>{elements}</BobineColorsWrapper>;
  }
}

const BobineColorsWrapper = styled.div`
  display: flex;
  align-items: center;
`;

const Padding = styled.div`
  width: 8px;
`;

const LinkIcon = styled(SVGIcon)`
  transform: rotate(-45deg);
  margin: 0 -8px;
`;
