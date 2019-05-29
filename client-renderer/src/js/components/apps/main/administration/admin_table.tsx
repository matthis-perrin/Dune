import * as React from 'react';
import styled from 'styled-components';

import {SizeMonitor} from '@root/components/core/size_monitor';
import {FilterableTable} from '@root/components/table/filterable_table';
import {ColumnMetadata, SortInfo} from '@root/components/table/sortable_table';
import {theme} from '@root/theme/default';

interface Props<T extends {sommeil: boolean}> {
  data: T[];
  lastUpdate: number;
  columns: ColumnMetadata<T>[];
  initialSort?: SortInfo;
  title: string;
}

export class AdminTable<T extends {sommeil: boolean}> extends React.Component<Props<T>> {
  public static displayName = 'AdminTable';

  private readonly filterEnSommeil = (row1: T): boolean => !row1.sommeil;

  public render(): JSX.Element {
    const {data, columns, title, lastUpdate} = this.props;

    return (
      <Container>
        <SizeMonitor>
          {(width, height) => {
            return (
              <FilterableTable
                data={data}
                lastUpdate={lastUpdate}
                columns={columns}
                initialSort={{
                  columnName: 'lastUpdate',
                  asc: false,
                }}
                title={title}
                filterTitle="en sommeil"
                filterFunction={this.filterEnSommeil}
                width={width - 2 * theme.page.padding - 2 * theme.table.borderThickness}
                height={height - 2 * theme.page.padding}
              />
            );
          }}
        </SizeMonitor>
      </Container>
    );
  }
}

const Container = styled.div`
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: ${theme.page.padding}px;
  background-color: ${theme.page.backgroundColor};
`;

export const LoadingTable = styled(Container)`
  display: flex;
  flex-direction: column;
  align-item: center;
  justify-content: center;
`;
