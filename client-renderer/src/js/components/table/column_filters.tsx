import * as React from 'react';
import {ColumnFilter} from '@root/components/table/sortable_table';

interface ColumnFilterProps<T, U> {
  data: T[];
  filter: ColumnFilter<T, U>;
  onChange(filter: (row: T) => boolean, isEnabled: boolean): void;
}

export class ColumnFilterPane<T, U> extends React.Component<ColumnFilterProps<T, U>> {
  public static displayName = 'ColumnFilter';

  public render(): JSX.Element {
    return <div>Popup!</div>;
  }
}
