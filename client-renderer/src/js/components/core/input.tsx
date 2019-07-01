import {omit} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {theme} from '@root/theme';

interface InputProps
  extends React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
  focusOnMount?: boolean;
  blurOn?: string[];
  ref?: React.RefObject<HTMLInputElement>;
}

export class Input extends React.Component<InputProps> {
  public static displayName = 'Input';
  private readonly inputRef = React.createRef<HTMLInputElement>();

  public componentDidMount(): void {
    if (!this.props.focusOnMount) {
      return;
    }
    const inputElement = this.getRef().current;
    if (inputElement) {
      inputElement.focus();
    }
  }

  private getRef(): React.RefObject<HTMLInputElement> {
    return this.props.ref || this.inputRef;
  }

  private readonly handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    const {blurOn = []} = this.props;
    const inputElement = this.getRef().current;
    if (inputElement && blurOn.indexOf(event.key) !== -1) {
      inputElement.blur();
    }
  };

  private readonly handleFocus = (event: React.FocusEvent<HTMLInputElement>): void => {
    const inputElement = this.getRef().current;
    if (inputElement) {
      inputElement.setSelectionRange(0, inputElement.value.length);
    }
  };

  public render(): JSX.Element {
    return (
      <StyledInput
        onKeyDown={this.handleKeyDown}
        onFocus={this.handleFocus}
        ref={this.getRef()}
        {...omit(this.props, ['focusOnMount'])}
      />
    );
  }
}

const StyledInput = styled.input`
  font-family: ${theme.base.fontFamily};
  height: ${theme.input.height}px;
  line-height: ${theme.input.height}px;
  border: solid ${theme.input.borderThickness}px ${theme.input.borderColor};
  box-sizing: border-box;
  outline: none;
  padding: ${theme.input.padding};
  border-radius: ${theme.input.borderRadius}px;
`;
