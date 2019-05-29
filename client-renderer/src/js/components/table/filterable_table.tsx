import * as React from 'react';
import styled from 'styled-components';

import {ColumnType} from '@root/components/table/column';
import {ColumnMetadata, SortableTable, SortInfo} from '@root/components/table/sortable_table';
import {theme} from '@root/theme/default';

import {asString} from '@shared/type_utils';

interface Props<T> {
  data: T[];
  lastUpdate: number;
  columns: ColumnMetadata<T>[];
  initialSort?: SortInfo;
  onSelected?(row: T): void;
  title: string;
  filterTitle: string;
  filterFunction(row: T): boolean;
  width: number;
  height: number;
}

interface State {
  showFiltered: boolean;
  searchValue: string;
}

export class FilterableTable<T> extends React.Component<Props<T>, State> {
  public static displayName = 'FilterableTable';

  public constructor(props: Props<T>) {
    super(props);
    this.state = {
      showFiltered: false,
      searchValue: '',
    };
  }

  private readonly handleRowClick = (row: T, event: React.MouseEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    if (this.props.onSelected) {
      this.props.onSelected(row);
    }
  };

  private readonly handleSommeilCheckboxChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    this.setState({showFiltered: !this.state.showFiltered});
  };

  private readonly handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const searchValue = event.target.value;
    this.setState({searchValue});
  };

  private renderFooter(data: T[]): JSX.Element {
    const {title, filterTitle} = this.props;
    const pluralCharacter = data.length === 1 ? '' : 's';
    return (
      <FooterContainer>
        <FooterForm>
          <label>
            <FooterCheckbox
              type="checkbox"
              checked={this.state.showFiltered}
              onChange={this.handleSommeilCheckboxChange}
            />
            {`Afficher les ${title}s ${filterTitle}`}
          </label>
        </FooterForm>
        <FooterStats>
          {`${data.length} ${title}${pluralCharacter} affichee${pluralCharacter}`}
        </FooterStats>
      </FooterContainer>
    );
  }

  public render(): JSX.Element {
    const {data, columns, filterFunction, width, height, lastUpdate} = this.props;
    const {showFiltered, searchValue} = this.state;
    const filteredData = data.filter(d => {
      if (!showFiltered && !filterFunction(d)) {
        return false;
      }
      if (searchValue.length > 0) {
        let hasMatch = false;
        for (const column of columns) {
          if (column.type === ColumnType.String) {
            // tslint:disable-next-line:no-any
            const value = asString((d as any)[column.name], undefined);
            if (value !== undefined && value.includes(searchValue)) {
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
            if (!filterFunction(row)) {
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

const SearchInput = styled.input`
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
