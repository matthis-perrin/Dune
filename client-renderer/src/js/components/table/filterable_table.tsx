import {without} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {Input} from '@root/components/core/input';
import {ColumnType} from '@root/components/table/column';
import {ColumnMetadata, SortableTable, SortInfo} from '@root/components/table/sortable_table';
import {theme} from '@root/theme/default';

import {asString, asMap} from '@shared/type_utils';

export interface TableFilter<T> {
  title: string;
  shouldShowRow(row: T, filterEnabled: boolean): boolean;
  enableByDefault: boolean;
}

interface Props<T, U> {
  data: T[];
  lastUpdate: number;
  columns: ColumnMetadata<T, U>[];
  initialSort?: SortInfo;
  onSelected?(row: T): void;
  title: string;
  filters?: TableFilter<T>[];
  isRowDisabled?(row: T): boolean;
  width: number;
  height: number;
}

interface State<T> {
  enabledFilters: ((row: T, filterEnabled: boolean) => boolean)[];
  searchValue: string;
}

export class FilterableTable<T, U> extends React.Component<Props<T, U>, State<T>> {
  public static displayName = 'FilterableTable';

  public constructor(props: Props<T, U>) {
    super(props);
    this.state = {
      enabledFilters: (props.filters || [])
        .filter(f => f.enableByDefault)
        .map(f => f.shouldShowRow),
      searchValue: '',
    };
  }

  private readonly handleRowClick = (row: T, event: React.MouseEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    if (this.props.onSelected && !(this.props.isRowDisabled && this.props.isRowDisabled(row))) {
      this.props.onSelected(row);
    }
  };

  private toggleFilter(filter: TableFilter<T>): void {
    const fn = filter.shouldShowRow;
    const {enabledFilters} = this.state;
    const filterIndex = enabledFilters.indexOf(fn);
    if (filterIndex === -1) {
      this.setState({enabledFilters: enabledFilters.concat([fn])});
    } else {
      this.setState({enabledFilters: without(enabledFilters, fn)});
    }
  }

  private readonly handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const searchValue = event.target.value;
    this.setState({searchValue});
  };

  private renderFilter(filter: TableFilter<T>): JSX.Element {
    const {shouldShowRow, title} = filter;
    return (
      <label key={filter.title}>
        <FooterCheckbox
          type="checkbox"
          checked={this.state.enabledFilters.indexOf(shouldShowRow) !== -1}
          onChange={() => this.toggleFilter(filter)}
        />
        {title}
      </label>
    );
  }

  private renderFooter(data: T[]): JSX.Element {
    const {title, filters = []} = this.props;
    const pluralCharacter = data.length === 1 ? '' : 's';
    const formTitle = filters.length > 0 ? 'Afficher: ' : '';
    return (
      <FooterContainer>
        <FooterForm>
          {formTitle}
          {filters.map(filter => this.renderFilter(filter))}
        </FooterForm>
        <FooterStats>
          {`${data.length} ${title}${pluralCharacter} affichee${pluralCharacter}`}
        </FooterStats>
      </FooterContainer>
    );
  }

  public render(): JSX.Element {
    const {data, columns, width, height, lastUpdate, filters = []} = this.props;
    const {searchValue, enabledFilters} = this.state;
    const filteredData = data.filter(d => {
      let isFilteredOut = true;
      for (const filter of filters) {
        if (filter.shouldShowRow(d, enabledFilters.indexOf(filter.shouldShowRow) !== -1)) {
          isFilteredOut = false;
        }
      }
      if (isFilteredOut) {
        return false;
      }
      if (searchValue.length > 0) {
        let hasMatch = false;
        for (const column of columns) {
          if (column.type === ColumnType.String) {
            const cellRawValue = asMap(d)[column.name];
            const value = asString(cellRawValue, undefined);
            if (value !== undefined && value.toUpperCase().includes(searchValue.toUpperCase())) {
              hasMatch = true;
            }
          }
        }
        return hasMatch;
      }
      return true;
    });

    const tableBorderCount = 3;
    const searchInputHeight = 30;
    return (
      <TableContainer>
        <SearchInput
          focusOnMount
          type="text"
          placeholder="Search something"
          value={this.state.searchValue}
          onChange={this.handleSearchChange}
        />
        <SortableTable
          data={filteredData}
          lastUpdate={lastUpdate}
          columns={columns}
          onRowClick={this.handleRowClick}
          initialSort={{
            columnName: 'lastUpdate',
            asc: false,
          }}
          width={width}
          height={
            height -
            theme.table.headerHeight -
            theme.table.footerHeight -
            tableBorderCount * theme.table.borderThickness -
            searchInputHeight
          }
          rowStyles={row => {
            if (this.props.isRowDisabled && this.props.isRowDisabled(row)) {
              return {
                opacity: 0.5,
              };
            }
            return {};
          }}
        />
        {this.renderFooter(filteredData)}
      </TableContainer>
    );
  }
}

const SearchInput = styled(Input)`
  padding: 4px 8px;
  font-size: 16px;
  width: 100%;
  box-sizing: border-box;
`;

const FooterCheckbox = styled.input`
  margin: 0 4px 0 10px;
  position: relative;
  top: 2px;
`;

const FooterContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: ${theme.table.footerFontWeight}
  font-size: ${theme.table.footerFontSize}px;
  width: 100%;
  height: ${theme.table.footerHeight}px;
`;

const FooterForm = styled.div`
  flex-shrink: 0;
  margin-left: 10px;
`;

const FooterStats = styled.div`
  flex-grow: 1;
  text-align: right;
  font-size: 13px;
  margin-right: 10px;
`;

const TableContainer = styled.div`
  border: solid ${theme.table.borderThickness}px ${theme.table.borderColor};
  border-radius: ${theme.table.borderRadius}px;
  background-color: ${theme.table.backgroundColor};
`;
