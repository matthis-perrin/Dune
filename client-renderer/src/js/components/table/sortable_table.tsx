import * as React from 'react';

import {ColumnHeader, ColumnSortMode} from '@root/components/table/column';
import {FilterState} from '@root/components/table/column_filters';
import {FastTable} from '@root/components/table/fast_table';
import {theme} from '@root/theme/default';

// tslint:disable-next-line:no-null-keyword
// const DONT_UPDATE_STATE = null;

type SortFunction<T> = (val1: T, val2: T) => number;
type FilterType = 'group';

export interface ColumnFilter<T, U> {
  filterType?: FilterType;
  getValue(row: T): U;
  sortValue?(v1: U, v2: U): number;
}

export interface ColumnMetadata<T, U> {
  title: string;
  sortFunction?: SortFunction<T>;
  width?: number;
  filter?: ColumnFilter<T, U>;
  renderCell(element: T): JSX.Element | string;
  getSearchValue?(element: T): string;
  shouldRerender(prev: T, next: T): boolean;
}

export interface SortInfo {
  asc: boolean;
  index: number;
}

interface Props<T> {
  width: number;
  height: number;
  data: T[];
  lastUpdate: number;
  // tslint:disable:no-any
  columns: ColumnMetadata<T, any>[];
  initialSort?: SortInfo;
  onRowClick?(row: T, event: React.MouseEvent): void;
  rowStyles?(element: T): React.CSSProperties;
}

interface State<T> {
  sortedData: T[];
  filteredData: T[];
  sort?: SortInfo;
  hoveredIndex?: number;
}

const TABLE_STYLES = {
  borderTop: `solid ${theme.table.borderThickness}px ${theme.table.borderColor}`,
  borderBottom: `solid ${theme.table.borderThickness}px ${theme.table.borderColor}`,
};

export class SortableTable<T> extends React.PureComponent<Props<T>, State<T>> {
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
    if (
      prevProps.lastUpdate !== this.props.lastUpdate ||
      prevProps.data.length !== this.props.data.length
    ) {
      this.recomputeData(this.state.sort);
    }
  }

  // // tslint-disable-next-line:no-any
  // private getColumn(name: string): ColumnMetadata<T, any> | undefined {
  //   return this.props.columns.find(c => c.name === name);
  // }

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
        title={columnMetadata.title}
        filter={columnMetadata.filter}
        data={this.state.sortedData}
        // tslint:disable-next-line:no-unsafe-any
        filterData={filterState && filterState.filterStateData}
        onColumnFilterChange={this.handleColumnFilterChange.bind(this, index)}
      />
    );
  };

  private getFixedColumnsWidthSum(): number {
    return this.props.columns.reduce((acc, column) => acc + (column.width || 0), 0);
  }

  private getFixedColumnsWidthCount(): number {
    return this.props.columns.filter(col => col.width !== undefined).length;
  }

  private getVariableColumnWidthCount(): number {
    return this.props.columns.filter(col => col.width === undefined).length;
  }

  private readonly getColumnWidth = (index: number, width: number): number => {
    const col = this.props.columns[index];
    const SCROLLBAR_WIDTH = 17;
    const variableWidthCount = this.getVariableColumnWidthCount();
    const spaceLeftForVariables = width - this.getFixedColumnsWidthSum() - SCROLLBAR_WIDTH;

    if (col.width === undefined) {
      return spaceLeftForVariables / variableWidthCount;
    }
    if (variableWidthCount === 0) {
      return col.width + spaceLeftForVariables / this.getFixedColumnsWidthCount();
    }
    return col.width;
  };

  public render(): JSX.Element {
    const {width, height, columns, rowStyles, onRowClick} = this.props;
    const {filteredData} = this.state;

    return (
      <FastTable<T>
        width={width}
        height={height}
        columnCount={this.props.columns.length}
        rowCount={filteredData.length}
        getColumnWidth={this.getColumnWidth}
        rowHeight={theme.table.rowHeight}
        renderColumn={this.renderColumn}
        style={TABLE_STYLES}
        columns={columns}
        rowStyles={rowStyles}
        data={filteredData}
        onRowClick={onRowClick}
      />
    );
  }
}
