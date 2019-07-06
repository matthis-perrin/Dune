import * as React from 'react';
import styled from 'styled-components';

import {FilterBar} from '@root/components/common/filter_bar';
import {SearchBar} from '@root/components/common/search_bar';
import {SizeMonitor} from '@root/components/core/size_monitor';
import {ColumnMetadata, SortableTable} from '@root/components/table/sortable_table';
import {theme} from '@root/theme';

interface Props<T extends {ref: string; sommeil: boolean}> {
  data: T[];
  // tslint:disable-next-line:no-any
  columns: ColumnMetadata<T, any>[];
}

export class AdminTable<T extends {ref: string; sommeil: boolean}> extends React.Component<
  Props<T>
> {
  public static displayName = 'AdminTable';

  private readonly isActif = (v: T, e: boolean): boolean => {
    return e && !v.sommeil;
  };
  private readonly isEnSommeil = (v: T, e: boolean): boolean => {
    return e && v.sommeil;
  };

  public render(): JSX.Element {
    const {data, columns} = this.props;

    return (
      <SizeMonitor>
        {(width, height) => (
          <TableContainer>
            <FilterBar
              data={data}
              filters={[
                {
                  enableByDefault: true,
                  title: 'Actif',
                  shouldShowElement: this.isActif,
                },
                {
                  enableByDefault: false,
                  title: 'En sommeil',
                  shouldShowElement: this.isEnSommeil,
                },
              ]}
            >
              {(filterBar, filteredData) => (
                <SearchBar data={filteredData} columns={columns}>
                  {(searchBar, searchedData) => (
                    <React.Fragment>
                      {searchBar}
                      <SortableTable<T>
                        data={searchedData}
                        columns={columns}
                        initialSort={{
                          index: 0,
                          asc: true,
                        }}
                        width={width}
                        height={height - theme.table.footerHeight - theme.table.searchBarHeight}
                        rowStyles={row => ({
                          opacity: row.sommeil ? theme.table.disabledOpacity : 1,
                        })}
                      />
                      {filterBar}
                    </React.Fragment>
                  )}
                </SearchBar>
              )}
            </FilterBar>
          </TableContainer>
        )}
      </SizeMonitor>
    );
  }
}

const TableContainer = styled.div`
  background-color: ${theme.table.backgroundColor};
`;
