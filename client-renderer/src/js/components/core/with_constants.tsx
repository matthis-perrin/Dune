import * as React from 'react';
import {constantsStore} from '@root/stores/data_store';
import {Constants} from '@shared/models';

interface Props {
  children(constants?: Constants): JSX.Element;
}

interface State {
  constantsData?: Constants;
}

export class WithConstants extends React.Component<Props, State> {
  public static displayName = 'WithConstant';

  constructor(props: Props) {
    super(props);
    const constants = constantsStore.getData();
    this.state = {
      constantsData: constants && constants[0],
    };
  }

  public componentDidUpdate(nextProps: Props, nextState: State): void {
    if (this.props.children !== nextProps.children) {
      this.handleConstantsChanged();
    }
  }

  public componentDidMount(): void {
    constantsStore.addListener(this.handleConstantsChanged);
  }

  public componentWillUnmount(): void {
    constantsStore.removeListener(this.handleConstantsChanged);
  }

  private readonly handleConstantsChanged = (): void => {
    const constants = constantsStore.getData();
    this.setState({constantsData: constants && constants[0]});
  };

  public render(): JSX.Element {
    const {children} = this.props;
    const {constantsData} = this.state;
    return children(constantsData);
  }
}
