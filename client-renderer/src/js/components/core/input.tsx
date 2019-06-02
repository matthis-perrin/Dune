import {omit} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

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

  public render(): JSX.Element {
    return (
      <StyledInput
        onKeyDown={this.handleKeyDown}
        ref={this.getRef()}
        {...omit(this.props, ['focusOnMount'])}
      />
    );
  }
}

const StyledInput = styled.input`
  font-family: Segoe UI;
`;
