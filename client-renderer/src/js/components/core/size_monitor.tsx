import * as React from 'react';

interface SizeMonitorProps {
  children(width: number, height: number): JSX.Element;
}

interface SizeMonitorState {
  width: number;
  height: number;
}

const SCROLLBAR_WIDTH = 17;

export class SizeMonitor extends React.Component<SizeMonitorProps, SizeMonitorState> {
  public static displayName = 'SizeMonitor';

  public constructor(props: SizeMonitorProps) {
    super(props);
    this.state = this.getState();
  }

  public componentDidMount(): void {
    window.addEventListener('resize', this.refreshState, false);
    new ResizeObserver(this.refreshState).observe(document.body);
    this.refreshState();
  }

  public componentWillUnmount(): void {
    window.removeEventListener('resize', this.refreshState);
  }

  private windowHasVerticalScrollbar(): boolean {
    return document.body.scrollHeight > window.outerHeight;
  }

  private readonly refreshState = () => {
    this.setState(this.getState());
  };

  private getState(): SizeMonitorState {
    return {
      width: window.innerWidth - (this.windowHasVerticalScrollbar() ? SCROLLBAR_WIDTH : 0),
      height: window.innerHeight,
    };
  }

  public render(): JSX.Element {
    const {children} = this.props;
    const {width, height} = this.state;

    return children(width, height);
  }
}
