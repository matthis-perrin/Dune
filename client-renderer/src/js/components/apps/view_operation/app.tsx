import * as React from 'react';

import {LoadingTable} from '@root/components/apps/main/administration/admin_table';
import {operationsStore} from '@root/stores/list_store';

import {Operation} from '@shared/models';

export type ViewMode = 'view' | 'update' | 'create';

interface Props {
  operationId?: number;
  modeInitial: ViewMode;
}

interface State {
  operation?: Operation;
  currentMode: ViewMode;
}

export class ViewOperationApp extends React.Component<Props, State> {
  public static displayName = 'ViewOperationApp';

  public constructor(props: Props) {
    super(props);
    this.state = {currentMode: props.modeInitial};
  }

  public componentDidMount(): void {
    operationsStore.addListener(this.handleOperationsChange);
  }

  public componentWillUnmount(): void {
    operationsStore.removeListener(this.handleOperationsChange);
  }

  private readonly handleOperationsChange = (): void => {
    const {operationId} = this.props;
    const operations = operationsStore.getData() || [];
    const operation = operations.filter(o => o.id === operationId)[0];
    const titleSuffix = operation ? operation.description : `#${operationId}`;
    document.title = `Opérations ${titleSuffix}`;
    this.setState({operation});
  };

  public render(): JSX.Element {
    const {operation, currentMode} = this.state;

    if (!operation) {
      return <LoadingTable>Loading...</LoadingTable>;
    }
    return <span>{currentMode}</span>;
  }
}
