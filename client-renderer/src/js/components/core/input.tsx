import * as React from 'react';

interface InputProps extends React.HTMLProps<HTMLInputElement> {
  focusOnMount?: boolean;
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

  public render(): JSX.Element {
    return <input ref={this.getRef()} {...this.props} />;
  }
}
