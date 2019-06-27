import * as React from 'react';

import {LoadingScreen} from '@root/components/core/loading_screen';
import {AdminTable} from '@root/components/table/admin_table';
import {ClicheColumns} from '@root/components/table/columns';
import {clichesStore} from '@root/stores/list_store';

import {Cliche} from '@shared/models';

interface Props {}

interface State {
  cliches?: Cliche[];
}

export class ListClichesApp extends React.Component<Props, State> {
  public static displayName = 'ListClichesApp';

  public constructor(props: Props) {
    super(props);
    this.state = {};
  }

  public componentDidMount(): void {
    clichesStore.addListener(this.handleClichesChange);
  }

  public componentWillUnmount(): void {
    clichesStore.removeListener(this.handleClichesChange);
  }

  private readonly handleClichesChange = (): void => {
    const cliches = clichesStore.getData();
    document.title = `Liste des clichés (${cliches ? cliches.length : 0})`;
    this.setState({cliches});
  };

  public render(): JSX.Element {
    const {cliches} = this.state;

    if (!cliches) {
      return <LoadingScreen />;
    }
    return (
      <AdminTable
        data={cliches}
        columns={[
          ClicheColumns.Ref,
          ClicheColumns.Designation,
          ClicheColumns.NombrePoses,
          ClicheColumns.Couleur1,
          ClicheColumns.Couleur2,
          ClicheColumns.Couleur3,
          ClicheColumns.ImportanceOrdreCouleurs,
          ClicheColumns.LastUpdate,
        ]}
      />
    );
  }
}
