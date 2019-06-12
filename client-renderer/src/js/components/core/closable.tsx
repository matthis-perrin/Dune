import {omit} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {ReactProps} from '@root/components/core/common';
import {SVGIcon} from '@root/components/core/svg_icon';

interface ClosableProps
  extends ReactProps,
    React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  onClose?(): void;
  centeredWithOffset?: number;
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
    const {centeredWithOffset} = this.props;
    return centeredWithOffset !== undefined
      ? this.renderCenteredCloseButton(centeredWithOffset)
      : this.renderCornerCloseButton();
  }

  private renderCornerCloseButton(): JSX.Element {
    return (
      <CornerCloseButton onClick={this.props.onClose}>
        <SVGIcon name="cross" width={16} height={16} />
      </CornerCloseButton>
    );
  }

  private renderCenteredCloseButton(offset: number): JSX.Element {
    const sign = offset < 0 ? '-' : '+';
    const offsetAbs = Math.abs(offset);
    return (
      <CenteredCloseButton
        onClick={this.props.onClose}
        style={{left: `calc(50% - 30px ${sign} ${offsetAbs}px)`}}
      >
        Retirer
      </CenteredCloseButton>
    );
  }

  public render(): JSX.Element {
    const props = omit(this.props, ['onClose', 'centered', 'ref']);
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
  z-index: 100;
  cursor: pointer;
  opacity: 0.5;
  fill: #888;
  :hover {
    opacity: 1;
  }
`;

const CornerCloseButton = styled(CloseButton)`
  top: 0;
  right: 0;
  width: 24px;
  height: 24px;
`;

const CenteredCloseButton = styled(CloseButton)`
  top: 0;
  right: 0;
  width: 60px;
  height: 24px;
  text-align: center;
`;
