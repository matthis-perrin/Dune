import {omit} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {ReactProps} from '@root/components/core/common';
import {theme, Colors} from '@root/theme';

type ButtonMode = 'success' | 'warning' | 'danger' | 'neutral';

interface ButtonProps
  extends ReactProps,
    React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
  mode?: ButtonMode;
}

export class Button extends React.Component<ButtonProps> {
  public static displayName = 'Button';

  public render(): JSX.Element {
    const {mode} = this.props;
    const props = omit(this.props, ['mode', 'children', 'ref']);

    let ButtonClass = DefaultButton;
    if (mode === 'success') {
      ButtonClass = SuccessButton;
    } else if (mode === 'warning') {
      ButtonClass = WarningButton;
    } else if (mode === 'danger') {
      ButtonClass = DangerButton;
    } else if (mode === 'neutral') {
      ButtonClass = NeutralButton;
    }
    return <ButtonClass {...props}>{this.props.children}</ButtonClass>;
  }
}

export const ButtonBase = styled.button`
  display: inline-block;
  box-sizing: border-box;
  box-shadow: none;
  border: none;
  outline: none;
  cursor: pointer;

  font-family: ${theme.base.fontFamily};
  font-size: ${theme.button.fontSize}px;
  font-weight: ${theme.button.fontWeight};
  padding: ${theme.button.padding};
  color: ${theme.button.color};
  border-radius: ${theme.button.borderRadius}px;
  opacity: ${props => (props.disabled ? theme.button.disabledOpacity : 1)};
`;

export const DefaultButton = styled(ButtonBase)`
  background-color: ${theme.button.defaultBackgroundColor};
  &:hover {
    background-color: ${theme.button.defaultBackgroundColorHover};
  }
  &:active {
    background-color: ${theme.button.defaultBackgroundColor};
  }
`;

export const SuccessButton = styled(ButtonBase)`
  background-color: ${Colors.Success};
  &:hover {
    background-color: ${Colors.SuccessLight};
  }
  &:active {
    background-color: ${Colors.Success};
  }
`;

export const WarningButton = styled(ButtonBase)`
  background-color: ${Colors.Warning};
  &:hover {
    background-color: ${Colors.WarningLight};
  }
  &:active {
    background-color: ${Colors.Warning};
  }
`;

export const DangerButton = styled(ButtonBase)`
  background-color: ${Colors.Danger};
  &:hover {
    background-color: ${Colors.DangerLight};
  }
  &:active {
    background-color: ${Colors.Danger};
  }
`;

export const NeutralButton = styled(ButtonBase)`
  background-color: ${Colors.Neutral};
  &:hover {
    background-color: ${Colors.NeutralLight};
  }
  &:active {
    background-color: ${Colors.Neutral};
  }
`;
