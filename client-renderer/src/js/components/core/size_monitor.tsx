import * as React from 'react';

interface SizeMonitorProps {
  children(width: number, height: number): JSX.Element;
}

interface SizeMonitorState {
  width: number;
  height: number;
}

export class SizeMonitor extends React.Component<SizeMonitorProps, SizeMonitorState> {
  public static displayName = 'SizeMonitor';

  public constructor(props: SizeMonitorProps) {
    super(props);
    this.state = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }

  public componentDidMount(): void {
    window.addEventListener('resize', this.handleWindowResize, false);
  }

  public componentWillUnmount(): void {
    window.removeEventListener('resize', this.handleWindowResize);
  }

  private readonly handleWindowResize = () => {
    this.setState({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  };

  public render(): JSX.Element {
    const {children} = this.props;
    const {width, height} = this.state;

    return children(width, height);
  }
}
