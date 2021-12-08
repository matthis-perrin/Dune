import {omit} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {theme} from '@root/theme';

interface TextareaProps
  extends React.DetailedHTMLProps<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    HTMLTextAreaElement
  > {
  focusOnMount?: boolean;
  blurOn?: string[];
  ref?: React.RefObject<HTMLTextAreaElement>;
}

export class Textarea extends React.Component<TextareaProps> {
  public static displayName = 'Textarea';
  private readonly inputRef = React.createRef<HTMLTextAreaElement>();

  public componentDidMount(): void {
    if (!this.props.focusOnMount) {
      return;
    }
    const inputElement = this.getRef().current;
    if (inputElement) {
      inputElement.focus();
    }
  }

  private getRef(): React.RefObject<HTMLTextAreaElement> {
    return this.props.ref || this.inputRef;
  }

  private readonly handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    const {blurOn = []} = this.props;
    const inputElement = this.getRef().current;
    if (inputElement && blurOn.indexOf(event.key) !== -1) {
      inputElement.blur();
    }
  };

  private readonly handleFocus = (event: React.FocusEvent<HTMLTextAreaElement>): void => {
    const inputElement = this.getRef().current;
    if (inputElement) {
      inputElement.setSelectionRange(0, inputElement.value.length);
    }
  };

  public render(): JSX.Element {
    return (
      <StyledTextarea
        onKeyDown={this.handleKeyDown}
        onFocus={this.handleFocus}
        ref={this.getRef()}
        {...omit(this.props, ['focusOnMount'])}
      />
    );
  }
}

const StyledTextarea = styled.textarea`
  font-family: ${theme.base.fontFamily};
  border: solid ${theme.input.borderThickness}px ${theme.input.borderColor};
  box-sizing: border-box;
  outline: none;
  padding: ${theme.input.padding};
`;
