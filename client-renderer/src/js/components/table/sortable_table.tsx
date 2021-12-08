import * as React from 'react';

import {ColumnHeader, ColumnSortMode} from '@root/components/table/column';
import {FilterState} from '@root/components/table/column_filters';
import {FastTable} from '@root/components/table/fast_table';
import {theme} from '@root/theme';

// tslint:disable-next-line:no-null-keyword
// const DONT_UPDATE_STATE = null;

type SortFunction<T> = (val1: T, val2: T) => number;
type FilterType = 'group';

export interface ColumnFilter<T, U> {
  filterType?: FilterType;
  getValue(row: T): U;
  render?(row: T, value: U): JSX.Element;
  sortValue?(v1: U, v2: U): number;
}

export interface ColumnMetadata<T, U> {
  title: string | JSX.Element;
  renderCell(element: T): JSX.Element;
  shouldRerender(prev: T, next: T): boolean;

  sortFunction?: SortFunction<T>;
  width?: number;
  filter?: ColumnFilter<T, U>;
  getSearchValue?(element: T): string;
  justifyContent?: 'flex-start' | 'flex-end' | 'center';
}

export interface SortInfo {
  asc: boolean;
  index: number;
}

interface Props<T extends {ref: string}> {
  width: number;
  height: number;
  data: T[];
  // tslint:disable:no-any
  columns: ColumnMetadata<T, any>[];
  initialSort?: SortInfo;
  onRowClick?(row: T, event: React.MouseEvent): void;
  rowStyles?(element: T): React.CSSProperties;
}

interface State<T extends {ref: string}> {
  sortedData: T[];
  filteredData: T[];
  sort?: SortInfo;
  hoveredIndex?: number;
}

export class SortableTable<T extends {ref: string}> extends React.PureComponent<
  Props<T>,
  State<T>
> {
  public static displayName = 'SortableTable';

  private readonly columnFilters = new Map<number, FilterState<T>>();

  public constructor(props: Props<T>) {
    super(props);
    const {initialSort, data} = props;
    const sort = initialSort;
    this.state = {sortedData: data, sort, filteredData: data};
  }

  public componentDidMount(): void {
    this.recomputeData(this.state.sort);
  }

  public componentDidUpdate(prevProps: Props<T>): void {
    let hasChanged = prevProps.data.length !== this.props.data.length;
    if (!hasChanged) {
      for (let i = 0; i < this.props.data.length; i++) {
        if (this.props.data[i] !== prevProps.data[i]) {
          hasChanged = true;
          break;
        }
      }
    }
    if (hasChanged) {
      this.recomputeData(this.state.sort);
    }
  }

  private sortData(sortInfo?: SortInfo): T[] {
    const {data} = this.props;

    if (!sortInfo) {
      return data;
    }
    const {index, asc} = sortInfo;
    const column = this.props.columns[index];
    if (!column) {
      return data;
    }

    return [...data].sort((b1: T, b2: T) => {
      if (!column.sortFunction) {
        return 0;
      }
      const sortRes = column.sortFunction(b1, b2);
      return asc ? sortRes : -sortRes;
    });
  }

  private filterData(sortedData: T[]): T[] {
    return sortedData.filter(row => {
      for (const {filterFn} of this.columnFilters.values()) {
        if (!filterFn(row)) {
          return false;
        }
      }
      return true;
    });
  }

  private recomputeData(sortInfo?: SortInfo): void {
    const sortedData = this.sortData(sortInfo);
    const filteredData = this.filterData(sortedData);

    this.setState({
      sort: sortInfo,
      sortedData,
      filteredData,
    });
  }

  private readonly handleColumnFilterChange = (
    index: number,
    filterState: FilterState<T>
  ): void => {
    this.columnFilters.set(index, filterState);
    this.recomputeData(this.state.sort);
  };

  private readonly renderColumn = (index: number): JSX.Element => {
    const filterState = this.columnFilters.get(index);
    const columnMetadata = this.props.columns[index];
    const canSort = columnMetadata.sortFunction !== undefined;
    let sort: ColumnSortMode = 'none';
    if (this.state.sort && this.state.sort.index === index) {
      sort = this.state.sort.asc ? 'asc' : 'desc';
    }
    const isFirst = index === 0;
    const isLast = index === this.props.columns.length - 1;
    return (
      <ColumnHeader
        isFirst={isFirst}
        isLast={isLast}
        onClick={() => {
          if (columnMetadata.sortFunction === undefined) {
            return;
          }
          const newSortInfo = {
            index,
            asc: !(this.state.sort && this.state.sort.index === index && this.state.sort.asc),
          };
          this.recomputeData(newSortInfo);
        }}
        canSort={canSort}
        sort={sort}
        column={columnMetadata}
        data={this.state.sortedData}
        // tslint:disable-next-line:no-unsafe-any
        filterData={filterState && filterState.filterStateData}
        onColumnFilterChange={this.handleColumnFilterChange.bind(this, index)}
      />
    );
  };

  public render(): JSX.Element {
    const {width, height, columns, rowStyles, onRowClick} = this.props;
    const {filteredData} = this.state;

    return (
      <FastTable<T>
        width={width}
        height={height}
        rowHeight={theme.table.rowHeight}
        renderColumn={this.renderColumn}
        columns={columns}
        rowStyles={rowStyles}
        data={filteredData}
        onRowClick={onRowClick}
      />
    );
  }
}
