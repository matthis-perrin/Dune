import * as React from 'react';
import styled from 'styled-components';

import {Input} from '@root/components/core/input';
import {ColumnMetadata} from '@root/components/table/sortable_table';
import {theme} from '@root/theme';

interface SearchBarProps<T> {
  data: T[];
  // tslint:disable-next-line:no-any
  columns: ColumnMetadata<T, any>[];
  onChange(newData: T[]): void;
}

interface SearchState {
  searchValue: string;
}

export class SearchBar<T> extends React.Component<SearchBarProps<T>, SearchState> {
  public static displayName = 'SearchBar';

  public constructor(props: SearchBarProps<T>) {
    super(props);
    this.state = {
      searchValue: '',
    };
    this.props.onChange(this.props.data);
  }

  public componentDidUpdate(prevProps: SearchBarProps<T>): void {
    if (this.props.data !== prevProps.data) {
      this.filter(this.state.searchValue);
    }
  }

  private readonly handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const searchValue = event.target.value;
    this.filter(searchValue);
    this.setState({searchValue});
  };

  private filter(searchValue: string): void {
    const {onChange, data, columns} = this.props;

    const filteredData = data.filter(d => {
      if (searchValue.length > 0) {
        let hasMatch = false;
        for (const column of columns) {
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

    onChange(filteredData);
  }

  public render(): JSX.Element {
    const {searchValue} = this.state;
    return (
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
      </React.Fragment>
    );
  }
}

const SearchInput = styled(Input)`
  height: ${theme.table.searchBarHeight}
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
