import * as React from 'react';

import {AdminTable, LoadingTable} from '@root/components/apps/main/administration/admin_table';
import {PerfoColumns} from '@root/components/table/columns';
import {perfosStore} from '@root/stores/list_store';

import {Perfo} from '@shared/models';

interface Props {}

interface State {
  perfos?: Perfo[];
  lastUpdate: number;
}

export class ListPerfosApp extends React.Component<Props, State> {
  public static displayName = 'ListPerfosApp';

  public constructor(props: Props) {
    super(props);
    this.state = {lastUpdate: 0};
  }

  public componentDidMount(): void {
    perfosStore.addListener(this.handlePerfosChange);
  }

  public componentWillUnmount(): void {
    perfosStore.removeListener(this.handlePerfosChange);
  }

  private readonly handlePerfosChange = (): void => {
    const perfos = perfosStore.getData();
    document.title = `Liste des perfos (${perfos ? perfos.length : 0})`;
    this.setState({perfos, lastUpdate: perfosStore.getLastUpdate()});
  };

  public render(): JSX.Element {
    const {perfos, lastUpdate} = this.state;

    if (!perfos) {
      return <LoadingTable>Loading...</LoadingTable>;
    }
    return (
      <AdminTable
        title="perfo"
        data={perfos}
        lastUpdate={lastUpdate}
        columns={[
          PerfoColumns.Ref,
          PerfoColumns.DecalageInitial,
          PerfoColumns.Cale1,
          PerfoColumns.Bague1,
          PerfoColumns.Cale2,
          PerfoColumns.Bague2,
          PerfoColumns.Cale3,
          PerfoColumns.Bague3,
          PerfoColumns.Cale4,
          PerfoColumns.Bague4,
          PerfoColumns.Cale5,
          PerfoColumns.Bague5,
          PerfoColumns.Cale6,
          PerfoColumns.Bague6,
          PerfoColumns.Cale7,
          PerfoColumns.Bague7,
          PerfoColumns.LastUpdate,
        ]}
      />
    );
  }
}
