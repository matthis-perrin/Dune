import * as React from 'react';
import {colorsStore} from '@root/stores/data_store';
import {Color} from '@shared/models';

interface Props {
  color?: string;
  children(color: Color): JSX.Element;
}

interface State {
  colorData: Color;
}

export class WithColor extends React.Component<Props, State> {
  public static displayName = 'WithColor';

  constructor(props: Props) {
    super(props);
    this.state = {
      colorData: colorsStore.get(props.color),
    };
  }

  public componentDidUpdate(nextProps: Props, nextState: State): void {
    if (this.props.children !== nextProps.children || this.props.color !== nextProps.color) {
      this.handleColorsChanged();
    }
  }

  public componentDidMount(): void {
    colorsStore.addListener(this.handleColorsChanged);
  }

  public componentWillUnmount(): void {
    colorsStore.removeListener(this.handleColorsChanged);
  }

  private readonly handleColorsChanged = (): void => {
    const {color} = this.props;
    this.setState({colorData: colorsStore.get(color)});
  };

  public render(): JSX.Element {
    const {children} = this.props;
    const {colorData} = this.state;
    return children(colorData);
  }
}
