import * as React from 'react';

import {AdminTable, LoadingTable} from '@root/components/apps/main/administration/admin_table';
import {RefenteColumns} from '@root/components/table/columns';
import {refentesStore} from '@root/stores/list_store';

import {Refente} from '@shared/models';

interface Props {}

interface State {
  refentes?: Refente[];
  lastUpdate: number;
}

export class ListRefentesApp extends React.Component<Props, State> {
  public static displayName = 'ListRefentesApp';

  public constructor(props: Props) {
    super(props);
    this.state = {lastUpdate: 0};
  }

  public componentDidMount(): void {
    refentesStore.addListener(this.handleRefentesChange);
  }

  public componentWillUnmount(): void {
    refentesStore.removeListener(this.handleRefentesChange);
  }

  private readonly handleRefentesChange = (): void => {
    const refentes = refentesStore.getData();
    document.title = `Liste des refentes (${refentes ? refentes.length : 0})`;
    this.setState({refentes, lastUpdate: refentesStore.getLastUpdate()});
  };

  public render(): JSX.Element {
    const {refentes, lastUpdate} = this.state;

    if (!refentes) {
      return <LoadingTable>Loading...</LoadingTable>;
    }
    return (
      <AdminTable
        title="refentes"
        data={refentes}
        lastUpdate={lastUpdate}
        columns={[
          RefenteColumns.Ref,
          RefenteColumns.RefPerfo,
          RefenteColumns.Decalage,
          RefenteColumns.Laize1,
          RefenteColumns.Laize2,
          RefenteColumns.Laize3,
          RefenteColumns.Laize4,
          RefenteColumns.Laize5,
          RefenteColumns.Laize6,
          RefenteColumns.Laize7,
          RefenteColumns.Chute,
          RefenteColumns.LastUpdate,
        ]}
      />
    );
  }
}
