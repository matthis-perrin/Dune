import {omit} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {SVGIcon} from '@root/components/core/svg_icon';
import {theme} from '@root/theme';

interface CheckboxProps
  extends React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
  ref?: React.RefObject<HTMLInputElement>;
}

export class Checkbox extends React.Component<CheckboxProps> {
  public static displayName = 'Checkbox';
  private readonly inputRef = React.createRef<HTMLInputElement>();

  private getRef(): React.RefObject<HTMLInputElement> {
    return this.props.ref || this.inputRef;
  }

  public render(): JSX.Element {
    const {style, className} = this.props;
    const rest = omit(this.props, ['style', 'ref', 'className']);

    return (
      <CheckboxWrapper style={style} className={className}>
        <CheckboxInput {...rest} ref={this.getRef()} />
        <CheckboxIconWrapper>
          <SVGIcon name="check" width={theme.checkbox.iconSize} height={theme.checkbox.iconSize} />
        </CheckboxIconWrapper>
      </CheckboxWrapper>
    );
  }
}

const CheckboxWrapper = styled.div`
  display: inline-block;
  cursor: pointer;
  position: relative;
  width: ${theme.checkbox.size}px;
  height: ${theme.checkbox.size}px;
`;

const CheckboxInput = styled.input`
  position: absolute;
  top: 0;
  left: 0;
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  outline: none;
  opacity: 0;
  & + div {
    background-color: ${theme.checkbox.uncheckedBackgroundColor};
    fill: ${theme.checkbox.uncheckedBackgroundColor};
  }
  &:hover + div {
    fill: ${theme.checkbox.checkedColor};
  }
  &:checked + div {
    background-color: ${theme.checkbox.checkedBackgroundColor};
    fill: ${theme.checkbox.checkedColor};
  }
`;

const CheckboxIconWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
`;
