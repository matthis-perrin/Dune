import * as React from 'react';
import {GridChildComponentProps} from 'react-window';

import {ColumnHeader, ColumnSortMode, ColumnType} from '@root/components/table/column';
import {VirtualizedTable} from '@root/components/table/virtualized_table';
import {theme} from '@root/theme/default';

const stringSort = (val1: string, val2: string) =>
  val1.toLowerCase().localeCompare(val2.toLowerCase());
const numberSort = (val1: number, val2: number) => val1 - val2;
const booleanSort = (val1: boolean, val2: boolean) => (val1 && val2 ? 0 : val1 ? 1 : -1);
const dateSort = (val1: Date, val2: Date) => val1.getTime() - val2.getTime();

// tslint:disable-next-line:no-null-keyword
const DONT_UPDATE_STATE = null;

type SortFunction<T> = (val1: T, val2: T) => number;

// tslint:disable-next-line:no-any
function getDefaultSortFunction(columnType: ColumnType): SortFunction<any> {
  if (columnType === ColumnType.String) {
    return stringSort;
  }
  if (columnType === ColumnType.Number) {
    return numberSort;
  }
  if (columnType === ColumnType.Boolean) {
    return booleanSort;
  }
  if (columnType === ColumnType.Date) {
    return dateSort;
  }
  return stringSort;
}

type FilterType = 'group';

export interface ColumnFilter<T, U> {
  filterType?: FilterType;
  getValue(row: T): U;
  sortValue?(v1: U, v2: U): number;
}

export interface ColumnMetadata<T, U> {
  name: string;
  title: string;
  type: ColumnType;
  sortFunction?: SortFunction<T>;
  width?: number;
  filter?: ColumnFilter<T, U>;
  renderCell?(element: T): JSX.Element | string;
}

export interface SortInfo {
  asc: boolean;
  columnName: string;
}

interface Props<T, U> {
  width: number;
  height: number;
  data: T[];
  lastUpdate: number;
  columns: ColumnMetadata<T, U>[];
  initialSort?: SortInfo;
  onRowClick(row: T, event: React.MouseEvent): void;
  rowStyles?(element: T): React.CSSProperties;
}

interface State<T> {
  sortedData: T[];
  filteredData: T[];
  sort?: SortInfo;
  hoveredIndex?: number;
}

export class SortableTable<T, U> extends React.Component<Props<T, U>, State<T>> {
  public static displayName = 'SortableTable';

  private readonly columnFilters = new Map<number, (row: T) => boolean>();

  public constructor(props: Props<T, U>) {
    super(props);
    const {initialSort, data} = props;
    const sort = initialSort;
    this.state = {sortedData: data, sort, filteredData: data};
  }

  public componentDidMount(): void {
    this.recomputeData(this.state.sort);
  }

  public componentDidUpdate(prevProps: Props<T, U>): void {
    if (
      prevProps.lastUpdate !== this.props.lastUpdate ||
      prevProps.data.length !== this.props.data.length
    ) {
      this.recomputeData(this.state.sort);
    }
  }

  private getColumn(name: string): ColumnMetadata<T, U> | undefined {
    return this.props.columns.find(c => c.name === name);
  }

  private sortData(sortInfo?: SortInfo): T[] {
    const {data} = this.props;

    if (!sortInfo) {
      return data;
    }
    const {columnName, asc} = sortInfo;
    const column = this.getColumn(columnName);
    if (!column) {
      return data;
    }

    return data.sort((b1: T, b2: T) => {
      let sortRes = 0;

      if (column.sortFunction) {
        sortRes = column.sortFunction(b1, b2);
      } else {
        // tslint:disable-next-line:no-any
        const b1Val = (b1 as any)[column.name];
        // tslint:disable-next-line:no-any
        const b2Val = (b2 as any)[column.name];
        if (b1Val === undefined && b2Val === undefined) {
          sortRes = 0;
        } else if (b1Val === undefined && b2Val !== undefined) {
          sortRes = -1;
        } else if (b1Val !== undefined && b2Val === undefined) {
          sortRes = 1;
        } else {
          sortRes = getDefaultSortFunction(column.type)(b1Val, b2Val);
        }
      }
      return asc ? sortRes : -sortRes;
    });
  }

  private filterData(sortedData: T[]): T[] {
    return sortedData.filter(row => {
      for (const filterFn of this.columnFilters.values()) {
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
    this.setState(state => {
      if (state.hoveredIndex !== rowIndex) {
        return {...state, hoveredIndex: rowIndex};
      }
      return DONT_UPDATE_STATE;
    });
  }

  private handleCellMouseOut(rowIndex: number): void {
    this.setState(state => {
      if (state.hoveredIndex === rowIndex) {
        return {...state, hoveredIndex: undefined};
      }
      return DONT_UPDATE_STATE;
    });
  }

  private readonly renderCell = (props: GridChildComponentProps): JSX.Element => {
    const {rowIndex, columnIndex, style} = props;
    const {columns, rowStyles} = this.props;
    const isHovered = this.state.hoveredIndex === rowIndex;

    const line = this.state.filteredData[rowIndex];
    const {renderCell, type, name} = columns[columnIndex];
    const isFirst = columnIndex === 0;
    const isLast = columnIndex === columns.length - 1;
    const paddingLeft = isFirst ? theme.table.headerPadding : theme.table.headerPadding / 2;
    const paddingRight = isLast ? theme.table.headerPadding : theme.table.headerPadding / 2;
    const textAlign = type === ColumnType.Number ? 'right' : 'left';
    const backgroundColor = isHovered
      ? theme.table.rowBackgroundColorHovered
      : theme.table.rowBackgroundColor;
    const additionalStyles: React.CSSProperties = rowStyles ? rowStyles(line) : {};

    const transformedStyles: React.CSSProperties = {
      ...style,
      paddingLeft,
      paddingRight,
      textAlign,
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

    let cell = renderCell && renderCell(line);
    if (!cell) {
      // tslint:disable-next-line:no-any
      const unknownValue = (line as any)[name] as unknown;
      if (type === ColumnType.Date) {
        cell = <span>{(unknownValue as Date).toLocaleString('fr')}</span>;
      } else if (type === ColumnType.Boolean) {
        cell = <span>{(unknownValue as boolean) ? 'OUI' : 'NON'}</span>;
      } else {
        cell = <span>{(unknownValue as string) || '-'}</span>;
      }
    }

    return (
      <div
        onMouseOver={() => this.handleCellMouseOver(rowIndex)}
        onMouseOut={() => this.handleCellMouseOut(rowIndex)}
        onClick={event => this.props.onRowClick(line, event)}
        style={transformedStyles}
      >
        {cell}
      </div>
    );
  };

  private readonly handleColumnFilterChange = (
    index: number,
    filter: (row: T) => boolean
  ): void => {
    this.columnFilters.set(index, filter);
    this.recomputeData(this.state.sort);
  };

  private readonly renderColumn = (index: number): JSX.Element => {
    const columnMetadata = this.props.columns[index];
    let sort: ColumnSortMode = 'none';
    if (this.state.sort && this.state.sort.columnName === columnMetadata.name) {
      sort = this.state.sort.asc ? 'asc' : 'desc';
    }
    const isFirst = index === 0;
    const isLast = index === this.props.columns.length - 1;
    return (
      <ColumnHeader
        isFirst={isFirst}
        isLast={isLast}
        onClick={() => {
          const columnName = columnMetadata.name;
          const newSortInfo = {
            columnName,
            asc: !(
              this.state.sort &&
              this.state.sort.columnName === columnName &&
              this.state.sort.asc
            ),
          };
          this.recomputeData(newSortInfo);
        }}
        sort={sort}
        type={columnMetadata.type}
        title={columnMetadata.title}
        filter={columnMetadata.filter}
        data={this.state.sortedData}
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
        height={height}
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
