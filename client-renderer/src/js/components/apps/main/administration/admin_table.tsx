import * as React from 'react';
import styled from 'styled-components';

import {SizeMonitor} from '@root/components/core/size_monitor';
import {FilterableTable} from '@root/components/table/filterable_table';
import {ColumnMetadata, SortInfo} from '@root/components/table/sortable_table';
import {theme} from '@root/theme/default';

interface Props<T extends {sommeil: boolean}, U> {
  data: T[];
  lastUpdate: number;
  columns: ColumnMetadata<T, U>[];
  initialSort?: SortInfo;
  title: string;
  headerHeight?: number;
  onSelected?(row: T): void;
}

export class AdminTable<T extends {sommeil: boolean}, U> extends React.Component<Props<T, U>> {
  public static displayName = 'AdminTable';

  private shouldShowRow(row: T, filterEnabled: boolean): boolean {
    return filterEnabled || !row.sommeil;
  }

  public render(): JSX.Element {
    const {data, columns, title, lastUpdate, headerHeight = 0} = this.props;

    return (
      <Container style={{height: `calc(100% - ${headerHeight})`}}>
        <SizeMonitor>
          {(width, height) => {
            const borderCount = 3;
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
                filters={[
                  {
                    enableByDefault: false,
                    title: `${title} en sommeil`,
                    shouldShowRow: this.shouldShowRow,
                  },
                ]}
                isRowDisabled={row => row.sommeil}
                width={width - 2 * theme.page.padding - 2 * theme.table.borderThickness}
                height={
                  height -
                  2 * theme.page.padding -
                  borderCount * theme.table.borderThickness -
                  headerHeight
                }
                onSelected={this.props.onSelected}
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
