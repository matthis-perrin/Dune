import {omit} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {ReactProps} from '@root/components/core/common';
import {SVGIcon} from '@root/components/core/svg_icon';

interface ClosableProps
  extends ReactProps,
    React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  onClose?(): void;
  offset?: number;
  color: string;
}

export class Closable extends React.Component<ClosableProps> {
  public static displayName = 'Closable';

  private renderCloseButton(): JSX.Element {
    return this.renderCornerCloseButton();
  }

  private renderCornerCloseButton(): JSX.Element {
    const {offset = 0, color} = this.props;
    return (
      <CornerCloseButton
        style={{right: offset, fill: color}}
        className="close-button"
        onClick={this.props.onClose}
      >
        <SVGIcon name="cross" width={12} height={12} />
      </CornerCloseButton>
    );
  }

  public render(): JSX.Element {
    const props = omit(this.props, ['onClose', 'centeredWithOffset', 'ref', 'color', 'offset']);
    return (
      <Wrapper {...props}>
        {this.renderCloseButton()}
        {this.props.children}
      </Wrapper>
    );
  }
}

const Wrapper = styled.div`
  position: relative;
  &:hover {
    .close-button {
      display: flex;
    }
  }
`;

const CloseButton = styled.div`
  display: none;
  align-items: center;
  justify-content: center;
  position: absolute;
  z-index: 100;
  cursor: pointer;
  opacity: 0.5;
  :hover {
    opacity: 1;
  }
`;

const CornerCloseButton = styled(CloseButton)`
  top: 0;
  width: 32px;
  height: 32px;
`;
