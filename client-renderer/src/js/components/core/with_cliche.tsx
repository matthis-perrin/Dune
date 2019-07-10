import * as React from 'react';
import {clichesStore} from '@root/stores/list_store';
import {Cliche} from '@shared/models';

interface Props {
  ref: string;
  children(cliche?: Cliche): JSX.Element;
}

interface State {
  clicheData?: Cliche;
}

export class WithCliche extends React.Component<Props, State> {
  public static displayName = 'WithColor';

  constructor(props: Props) {
    super(props);
    this.state = {
      clicheData: clichesStore.get(props.ref),
    };
  }

  public componentDidUpdate(nextProps: Props, nextState: State): void {
    if (this.props.children !== nextProps.children || this.props.ref !== nextProps.ref) {
      this.handleColorsChanged();
    }
  }

  public componentDidMount(): void {
    clichesStore.addListener(this.handleColorsChanged);
  }

  public componentWillUnmount(): void {
    clichesStore.removeListener(this.handleColorsChanged);
  }

  private readonly handleColorsChanged = (): void => {
    const {ref} = this.props;
    this.setState({clicheData: clichesStore.get(ref)});
  };

  public render(): JSX.Element {
    const {children} = this.props;
    const {clicheData} = this.state;
    return children(clicheData);
  }
}
