import * as React from 'react';

interface AutoRefreshProps {
  interval?: number;
  children(): JSX.Element | string;
}

interface AutoRefreshState {
  child: JSX.Element | string;
}

const REFRESH_INTERVAL = 500;

export class AutoRefresh extends React.PureComponent<AutoRefreshProps, AutoRefreshState> {
  public static displayName = 'AutoRefresh';
  private interval: number | undefined;

  public constructor(props: AutoRefreshProps) {
    super(props);
    this.state = {child: props.children()};
  }

  public componentDidMount(): void {
    this.interval = setInterval(() => {
      this.setState({child: this.props.children()});
    }, this.props.interval || REFRESH_INTERVAL);
  }

  public componentWillUnmount(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  public render(): JSX.Element | string {
    return this.state.child;
  }
}
