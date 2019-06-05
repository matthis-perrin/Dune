import {omit} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {ReactProps} from '@root/components/core/common';
import {SVGIcon} from '@root/components/core/svg_icon';

interface ClosableProps
  extends ReactProps,
    React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  onClose?(): void;
}

interface ClosableState {
  isHovered: boolean;
}

export class Closable extends React.Component<ClosableProps, ClosableState> {
  public static displayName = 'Closable';

  public constructor(props: ClosableProps) {
    super(props);
    this.state = {
      isHovered: false,
    };
  }

  private readonly handleMouseEnter = (): void => {
    this.setState({isHovered: true});
  };

  private readonly handleMouseLeave = (): void => {
    this.setState({isHovered: false});
  };

  private renderCloseButton(): JSX.Element {
    if (!this.state.isHovered) {
      return <React.Fragment />;
    }
    return (
      <CloseButton onClick={this.props.onClose}>
        <SVGIcon name="cross" width={16} height={16} />
      </CloseButton>
    );
  }

  public render(): JSX.Element {
    const props = omit(this.props, ['onClose', 'ref']);
    return (
      <Wrapper {...props} onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave}>
        {this.renderCloseButton()}
        {this.props.children}
      </Wrapper>
    );
  }
}

const Wrapper = styled.div`
  position: relative;
`;

const CloseButton = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  width: 24px;
  height: 24px;
  cursor: pointer;
  opacity: 0.5;
  fill: #888;
  :hover {
    opacity: 1;
  }
`;
