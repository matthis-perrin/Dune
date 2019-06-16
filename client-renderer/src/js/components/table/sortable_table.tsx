import * as React from 'react';
import {GridChildComponentProps} from 'react-window';

import {ColumnHeader, ColumnSortMode} from '@root/components/table/column';
import {FilterState} from '@root/components/table/column_filters';
import {VirtualizedTable} from '@root/components/table/virtualized_table';
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

export class SortableTable<T> extends React.Component<Props<T>, State<T>> {
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

    return data.sort((b1: T, b2: T) => {
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

  private handleCellMouseOver(rowIndex: number): void {
    // this.setState(state => {
    //   if (state.hoveredIndex !== rowIndex) {
    //     return {...state, hoveredIndex: rowIndex};
    //   }
    //   return DONT_UPDATE_STATE;
    // });
  }

  private handleCellMouseOut(rowIndex: number): void {
    // this.setState(state => {
    //   if (state.hoveredIndex === rowIndex) {
    //     return {...state, hoveredIndex: undefined};
    //   }
    //   return DONT_UPDATE_STATE;
    // });
  }

  private readonly renderCell = (props: GridChildComponentProps): JSX.Element => {
    const {rowIndex, columnIndex, style} = props;
    const {columns, rowStyles} = this.props;
    const isHovered = this.state.hoveredIndex === rowIndex;

    const line = this.state.filteredData[rowIndex];
    const {renderCell} = columns[columnIndex];
    const isFirst = columnIndex === 0;
    const isLast = columnIndex === columns.length - 1;
    const paddingLeft = isFirst ? theme.table.headerPadding : theme.table.headerPadding / 2;
    const paddingRight = isLast ? theme.table.headerPadding : theme.table.headerPadding / 2;
    const backgroundColor = isHovered
      ? theme.table.rowBackgroundColorHovered
      : theme.table.rowBackgroundColor;
    const additionalStyles: React.CSSProperties = rowStyles ? rowStyles(line) : {};

    const transformedStyles: React.CSSProperties = {
      ...style,
      paddingLeft,
      paddingRight,
      backgroundColor,
      lineHeight: `${style.height}px`,
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      boxSizing: 'border-box',
      fontSize: theme.table.rowFontSize,
      fontWeight: theme.table.rowFontWeight,
      cursor: 'pointer',
      userSelect: 'auto',
      ...additionalStyles,
    };

    // if (!cell) {
    //   // tslint:disable-next-line:no-any
    //   const unknownValue = (line as any)[name] as unknown;
    //   if (type === ColumnType.Date) {
    //     cell = <span>{(unknownValue as Date).toLocaleString('fr')}</span>;
    //   } else if (type === ColumnType.Boolean) {
    //     cell = <span>{(unknownValue as boolean) ? 'OUI' : 'NON'}</span>;
    //   } else {
    //     cell = <span>{(unknownValue as string) || '-'}</span>;
    //   }
    // }

    return (
      <div
        onMouseOver={() => this.handleCellMouseOver(rowIndex)}
        onMouseOut={() => this.handleCellMouseOut(rowIndex)}
        onClick={event => this.props.onRowClick && this.props.onRowClick(line, event)}
        style={transformedStyles}
      >
        {renderCell(line)}
      </div>
    );
  };

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
    const {width, height} = this.props;
    const {filteredData} = this.state;

    return (
      <VirtualizedTable
        width={width}
        height={height - theme.table.headerHeight}
        columnCount={this.props.columns.length}
        rowCount={filteredData.length}
        getColumnWidth={this.getColumnWidth}
        rowHeight={theme.table.rowHeight}
        renderCell={this.renderCell}
        renderColumn={this.renderColumn}
        style={{
          borderTop: `solid ${theme.table.borderThickness}px ${theme.table.borderColor}`,
          borderBottom: `solid ${theme.table.borderThickness}px ${theme.table.borderColor}`,
        }}
      />
    );
  }
}
