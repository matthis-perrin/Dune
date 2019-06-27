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

interface State<T extends {ref: string; sommeil: boolean}> {
  filteredElements?: T[];
  filteredSearchedElements?: T[];
}

export class AdminTable<T extends {ref: string; sommeil: boolean}> extends React.Component<
  Props<T>,
  State<T>
> {
  public static displayName = 'AdminTable';

  public constructor(props: Props<T>) {
    super(props);
    this.state = {};
  }

  private readonly isActif = (v: T, e: boolean): boolean => {
    return e && !v.sommeil;
  };
  private readonly isEnSommeil = (v: T, e: boolean): boolean => {
    return e && v.sommeil;
  };

  private readonly handleElementsFiltered = (filteredElements: T[]): void => {
    this.setState({filteredElements});
  };

  private readonly handleElementsFilteredAndSearched = (filteredSearchedElements: T[]): void => {
    this.setState({filteredSearchedElements});
  };

  public render(): JSX.Element {
    const {data, columns} = this.props;
    const {filteredElements = [], filteredSearchedElements} = this.state;

    return (
      <SizeMonitor>
        {(width, height) => (
          <TableContainer>
            <SearchBar
              data={filteredElements}
              columns={columns}
              onChange={this.handleElementsFilteredAndSearched}
            />
            <SortableTable<T>
              data={filteredSearchedElements || filteredElements}
              columns={columns}
              initialSort={{
                index: 0,
                asc: false,
              }}
              width={width}
              height={height - theme.table.footerHeight - theme.table.searchBarHeight}
              rowStyles={row => ({
                opacity: row.sommeil ? theme.table.disabledOpacity : 1,
              })}
            />
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
              onChange={this.handleElementsFiltered}
            />
          </TableContainer>
        )}
      </SizeMonitor>
    );
  }
}

const TableContainer = styled.div`
  background-color: ${theme.table.backgroundColor};
`;
