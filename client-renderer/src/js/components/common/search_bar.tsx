import * as React from 'react';
import styled from 'styled-components';

import {Input} from '@root/components/core/input';
import {ColumnMetadata} from '@root/components/table/sortable_table';
import {theme} from '@root/theme';

interface SearchBarProps<T> {
  data: T[];
  // tslint:disable-next-line:no-any
  columns?: ColumnMetadata<T, any>[];
  children(searchBar: JSX.Element, data: T[]): JSX.Element;
}

interface SearchState<T> {
  searchValue: string;
  filteredData: T[];
}

export class SearchBar<T> extends React.Component<SearchBarProps<T>, SearchState<T>> {
  public static displayName = 'SearchBar';

  public constructor(props: SearchBarProps<T>) {
    super(props);
    this.state = {
      searchValue: '',
      filteredData: props.data,
    };
  }

  public componentDidUpdate(prevProps: SearchBarProps<T>): void {
    if (this.props.data !== prevProps.data) {
      this.filter(this.state.searchValue);
    }
  }

  private readonly handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const searchValue = event.target.value;
    this.filter(searchValue);
  };

  private filter(searchValue: string): void {
    const {data, columns} = this.props;

    const filteredData = data.filter(d => {
      if (searchValue.length > 0) {
        let hasMatch = false;
        for (const column of columns || []) {
          if (column.getSearchValue) {
            const value = column.getSearchValue(d);
            if (value.toUpperCase().includes(searchValue.toUpperCase())) {
              hasMatch = true;
            }
          }
        }
        return hasMatch;
      }
      return true;
    });

    this.setState({filteredData, searchValue});
  }

  public render(): JSX.Element {
    const {children} = this.props;
    const {searchValue, filteredData} = this.state;
    return children(
      <React.Fragment>
        <SearchContainer>
          <SearchInput
            focusOnMount
            type="text"
            placeholder="Rechercher"
            value={searchValue}
            onChange={this.handleSearchChange}
          />
        </SearchContainer>
        <Padding />
      </React.Fragment>,
      filteredData
    );
  }
}

const SearchInput = styled(Input)`
  height: ${theme.table.searchBarHeight}px;
  font-size: 16px;
  width: 100%;
  box-sizing: border-box;
`;

const SearchContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  box-sizing: border-box;
  background-color: white;
`;

const Padding = styled.div`
  height: ${theme.table.searchBarHeight}px;
`;
