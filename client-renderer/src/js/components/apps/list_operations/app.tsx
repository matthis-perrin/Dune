import * as React from 'react';

import {AdminTable, LoadingTable} from '@root/components/apps/main/administration/admin_table';
import {Button} from '@root/components/core/button';
import {getOperationsColumns} from '@root/components/table/table_columns';
import {bridge} from '@root/lib/bridge';
import {operationsStore} from '@root/stores/list_store';

import {Operation} from '@shared/models';

interface Props {}

interface State {
  operations?: Operation[];
  lastUpdate: number;
}

export class ListOperationsApp extends React.Component<Props, State> {
  public static displayName = 'ListOperationsApp';

  public constructor(props: Props) {
    super(props);
    this.state = {lastUpdate: 0};
  }

  public componentDidMount(): void {
    operationsStore.addListener(this.handleOperationsChange);
  }

  public componentWillUnmount(): void {
    operationsStore.removeListener(this.handleOperationsChange);
  }

  private readonly handleOperationsChange = (): void => {
    const operations = operationsStore.getData();
    document.title = `Liste des opérations (${operations ? operations.length : 0})`;
    this.setState({operations, lastUpdate: operationsStore.getLastUpdate()});
  };

  public render(): JSX.Element {
    const {operations, lastUpdate} = this.state;

    if (!operations) {
      return <LoadingTable>Loading...</LoadingTable>;
    }
    return (
      <React.Fragment>
        <Button onClick={() => bridge.viewOperation(undefined, 'create')}>Créer</Button>
        <AdminTable
          title="opération"
          data={operations}
          lastUpdate={lastUpdate}
          columns={getOperationsColumns()}
        />
      </React.Fragment>
    );
  }
}
