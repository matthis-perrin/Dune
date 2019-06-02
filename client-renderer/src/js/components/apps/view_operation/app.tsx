import * as React from 'react';
import styled from 'styled-components';

import {LoadingTable} from '@root/components/apps/main/administration/admin_table';
import {OperationForm} from '@root/components/apps/view_operation/operation_form';
import {Button} from '@root/components/core/button';
import {bridge} from '@root/lib/bridge';
import {operationsStore} from '@root/stores/list_store';

import {Operation, OperationConstraint} from '@shared/models';

interface Props {
  operationId?: number;
}

interface State {
  originalOperation?: Operation;
  operation?: Operation;
}

export class ViewOperationApp extends React.Component<Props, State> {
  public static displayName = 'ViewOperationApp';

  public constructor(props: Props) {
    super(props);
    this.state = {};
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
    this.setState({operation, originalOperation: operation}, this.updateTitle);
  };

  private readonly handleOperationChange = (operation: Operation): void => {
    this.setState({operation}, this.updateTitle);
  };

  private updateTitle(): void {
    const {operationId} = this.props;
    const {operation} = this.state;
    if (operationId && !operation) {
      document.title = "Chargement de l'opération...";
      return;
    }
    document.title = `Opération ${operation ? operation.description : ''}`;
  }

  private getDefaultOperation(): Operation {
    return {
      id: -1,
      description: '',
      required: false,
      constraint: OperationConstraint.None,
      duration: 0,
      sommeil: false,
      localUpdate: new Date(),
    };
  }

  private operationsAreEqual(o1: Operation, o2: Operation): boolean {
    const properties: (keyof Operation)[] = [
      'id',
      'description',
      'constraint',
      'duration',
      'required',
      'sommeil',
    ];
    for (const prop of properties) {
      if (o1[prop] !== o2[prop]) {
        return false;
      }
    }
    return true;
  }

  private readonly createOrUpdateOperation = () => {
    const {operation} = this.state;
    if (!operation) {
      return;
    }
    bridge
      .createOrUpdateOperation(operation)
      .then(() => bridge.closeApp())
      .catch(err => console.error(err));
  };

  private readonly deleteOperation = () => {
    const {operation} = this.state;
    if (!operation) {
      return;
    }
    bridge
      .createOrUpdateOperation({...operation, sommeil: true})
      .then(() => bridge.closeApp())
      .catch(err => console.error(err));
  };

  private renderControls(): JSX.Element {
    const {operationId} = this.props;
    const {operation, originalOperation} = this.state;
    if (operationId === undefined) {
      return (
        <Controls>
          <Button onClick={this.createOrUpdateOperation}>Créer</Button>
        </Controls>
      );
    }
    if (!operation || !originalOperation) {
      return <React.Fragment />;
    }
    const operationHasChanged = !this.operationsAreEqual(operation, originalOperation);
    const buttons = [
      <Button key="delete-button" onClick={this.deleteOperation}>
        Supprimer
      </Button>,
    ];
    if (operationHasChanged) {
      buttons.push(
        <Button key="create-button" onClick={this.createOrUpdateOperation}>
          Modifier
        </Button>
      );
    }

    return <Controls>{buttons}</Controls>;
  }

  public render(): JSX.Element {
    const {operationId} = this.props;
    const {operation = this.getDefaultOperation()} = this.state;

    if (operationId && !operation) {
      return <LoadingTable>Chargement...</LoadingTable>;
    }

    return (
      <App>
        <OperationForm operation={operation} onChange={this.handleOperationChange} />
        {this.renderControls()}
      </App>
    );
  }
}

const Controls = styled.div``;

const App = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background-color: #eee;
`;
