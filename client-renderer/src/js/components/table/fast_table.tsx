import {range, isEqual, memoize} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {ColumnMetadata} from '@root/components/table/sortable_table';
import {theme} from '@root/theme';

interface FastTableProps<T extends {ref: string}> {
  width: number;
  height: number;
  rowHeight: number;
  renderColumn?(index: number): JSX.Element;
  style?: React.CSSProperties;
  // tslint:disable-next-line:no-any
  columns: ColumnMetadata<T, any>[];
  rowStyles?(element: T): React.CSSProperties;
  data: T[];
  onRowClick?(row: T, event: React.MouseEvent): void;
}

const getStringHash = memoize(
  (value: string): number => {
    let hash = 0;
    const l = value.length;
    if (l === 0) {
      return hash;
    }
    for (let i = 0; i < l; i++) {
      const char = value.charCodeAt(i);
      // tslint:disable-next-line:no-bitwise no-magic-numbers
      hash = (hash << 5) - hash + char;
      // tslint:disable-next-line:no-bitwise no-magic-numbers
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }
);

export class FastTable<T extends {ref: string}> extends React.Component<FastTableProps<T>> {
  public static displayName = 'FastTable';
  //   private readonly updateIndexTimeout: number | undefined;
  private readonly tableContainerRef = React.createRef<HTMLDivElement>();
  private readonly rows = new Map<string, {data: T; rowIndex?: number}>();

  private dataIsEqual(data1: T[], data2: T[]): boolean {
    if (data1.length !== data2.length) {
      return false;
    }
    for (let i = 0; i < data1.length; i++) {
      if (data1[i] !== data2[i]) {
        return false;
      }
    }
    return true;
  }

  private readonly getRowClickHandlerForRef = memoize(
    (ref: string) => (event: React.MouseEvent<HTMLDivElement>) => {
      const {onRowClick} = this.props;
      if (!onRowClick) {
        return;
      }
      const row = this.rows.get(ref);
      if (row) {
        onRowClick(row.data, event);
      }
    }
  );

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

  public shouldComponentUpdate(nextProps: FastTableProps<T>): boolean {
    const hasChanged =
      this.props.width !== nextProps.width ||
      this.props.height !== nextProps.height ||
      this.props.rowHeight !== nextProps.rowHeight ||
      this.props.renderColumn !== nextProps.renderColumn ||
      this.props.style !== nextProps.style ||
      this.props.columns !== nextProps.columns ||
      this.props.rowStyles !== nextProps.rowStyles ||
      this.props.onRowClick !== nextProps.onRowClick;

    const hasDataChanged = !this.dataIsEqual(this.props.data, nextProps.data);

    if (hasChanged || hasDataChanged) {
      for (const row of this.rows.values()) {
        row.rowIndex = undefined;
      }
      nextProps.data.forEach((data, rowIndex) =>
        this.rows.set(data.ref, {data: {...data}, rowIndex})
      );
    }
    return hasChanged || hasDataChanged;
  }

  public render(): JSX.Element {
    const {columns, height, renderColumn, rowHeight, rowStyles, style, width, data} = this.props;

    const rowCount = data.length;
    const columnCount = columns.length;

    const adjustedWidth = Math.max(
      this.getFixedColumnsWidthSum() + theme.table.minSizeForVariableColumns,
      width
    );
    const columnWidths = range(columnCount).map(index => this.getColumnWidth(index, adjustedWidth));

    let scrollOffset = 0;
    if (this.tableContainerRef.current) {
      scrollOffset = this.tableContainerRef.current.scrollTop;
    }
    const firstVisibleRowIndex = Math.floor(scrollOffset / rowHeight);
    const lastVisibleRowIndex = firstVisibleRowIndex + Math.ceil(height / rowHeight);
    const header = renderColumn ? (
      <ColumnContainer width={adjustedWidth}>
        {range(columnCount).map(i => (
          <div key={`column-${i}`} style={{width: this.getColumnWidth(i, adjustedWidth)}}>
            {renderColumn(i)}
          </div>
        ))}
      </ColumnContainer>
    ) : (
      <React.Fragment />
    );

    return (
      <div style={{width}}>
        {header}
        <div
          ref={this.tableContainerRef}
          style={{
            ...style,
            width: adjustedWidth,
            height: height - (renderColumn ? theme.table.headerHeight : 0),
            overflow: 'auto',
          }}
        >
          <Table style={{height: rowCount * rowHeight}}>
            {Array.from(this.rows.entries())
              .sort((e1, e2) => getStringHash(e1[0]) - getStringHash(e2[0]))
              .map(([ref, rowData]) => {
                const {rowIndex} = rowData;
                const styles: React.CSSProperties = {};
                if (rowIndex !== undefined) {
                  styles.top = rowIndex * rowHeight;
                  styles.visibility = 'visible';
                }
                const rowStylesData = rowStyles ? rowStyles(rowData.data) : {};
                return (
                  <RowContainer
                    key={ref}
                    style={{
                      ...styles,
                      ...rowStylesData,
                    }}
                    onClick={this.getRowClickHandlerForRef(ref)}
                    background={
                      rowIndex !== undefined && rowIndex % 2 === 0
                        ? theme.table.rowEvenBackgroundColor
                        : theme.table.rowOddBackgroundColor
                    }
                  >
                    <FastTableRow
                      isVisible={
                        rowIndex !== undefined &&
                        rowIndex >= firstVisibleRowIndex &&
                        rowIndex <= lastVisibleRowIndex
                      }
                      columns={columns}
                      columnWidths={columnWidths}
                      rowHeight={rowHeight}
                      data={rowData.data}
                    />
                  </RowContainer>
                );
              })}
          </Table>
        </div>
      </div>
    );
  }
}

const ColumnContainer = styled.div<{width: number}>`
  display: flex;
  width: ${props => props.width}px;
  background-color: ${theme.table.headerBackgroundColor};
`;

const RowContainer = styled.div<{background: string}>`
  display: flex;
  position: absolute;
  top: -1000px;
  background-color: ${props => props.background};
  transition: background-color 100ms ease-in-out
  &:hover {
    background-color: ${theme.table.rowBackgroundColorHovered};
  }
`;

const Table = styled.div`
  position: relative;
`;

interface FastTableRowProps<T extends {ref: string}> {
  // tslint:disable-next-line:no-any
  columns: ColumnMetadata<T, any>[];
  columnWidths: number[];
  rowHeight: number;
  data: T;
  isVisible: boolean;
}

const WAIT_BEFORE_RENDER_WHEN_NOT_VISIBLE = 100;

export class FastTableRow<T extends {ref: string}> extends React.Component<FastTableRowProps<T>> {
  private forceRerenderTimeout: number | undefined;

  public shouldComponentUpdate(nextProps: FastTableRowProps<T>): boolean {
    let shouldUpdate = false;
    if (!isEqual(this.props.columnWidths, nextProps.columnWidths)) {
      shouldUpdate = true;
    } else if (this.props.columns !== nextProps.columns) {
      shouldUpdate = true;
    }
    shouldUpdate = shouldUpdate || this.props.data !== nextProps.data;
    if (!shouldUpdate) {
      return false;
    }

    // If a re-render is scheduled, we cancel it because we will either schedule a new one, or directly render.
    if (this.forceRerenderTimeout) {
      clearTimeout(this.forceRerenderTimeout);
      this.forceRerenderTimeout = undefined;
    }

    // If the row is not visible, bypass the React lifecycle by returning false and schedule a re-render for later.
    // This improve performance greatly when resizing that table because a lot of render are triggered on rows that
    // are not visible.
    if (!nextProps.isVisible) {
      this.forceRerenderTimeout = setTimeout(
        () => this.forceUpdate(),
        WAIT_BEFORE_RENDER_WHEN_NOT_VISIBLE
      );
      return false;
    }

    // If the row is visible and has updated, render immediately
    return true;
  }

  public render(): JSX.Element {
    const {columns, data, columnWidths, rowHeight} = this.props;
    return (
      <React.Fragment>
        {range(columns.length).map(columnIndex => {
          const columnWidth = columnWidths[columnIndex];
          const isFirst = columnIndex === 0;
          const isLast = columnIndex === columns.length - 1;
          const paddingLeft = isFirst ? theme.table.headerPadding : theme.table.headerPadding / 2;
          const paddingRight = isLast ? theme.table.headerPadding : theme.table.headerPadding / 2;
          const justifyContent = columns[columnIndex].justifyContent || 'flex-start';

          const cellStyles: React.CSSProperties = {
            paddingLeft,
            paddingRight,
            justifyContent,
            width: columnWidth,
            height: rowHeight,
          };
          return (
            <CellWrapper key={columnIndex} style={cellStyles}>
              <FastTableCell column={columns[columnIndex]} data={data} />
            </CellWrapper>
          );
        })}
      </React.Fragment>
    );
  }
}

const CellWrapper = styled.div`
  box-sizing: border-box;
  font-size: ${theme.table.rowFontSize}px;
  font-weight: ${theme.table.rowFontWeight};
  user-select: auto;
  display: flex;
  align-items: center;
  & > * {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
`;

interface FastTableCellProps<T extends {ref: string}> {
  // tslint:disable-next-line:no-any
  column: ColumnMetadata<T, any>;
  data: T;
}

export class FastTableCell<T extends {ref: string}> extends React.Component<FastTableCellProps<T>> {
  public shouldComponentUpdate(nextProps: FastTableCellProps<T>): boolean {
    return (
      this.props.column !== nextProps.column ||
      this.props.column.shouldRerender(this.props.data, nextProps.data)
    );
  }

  public render(): JSX.Element {
    const {column, data} = this.props;
    return column.renderCell(data);
  }
}
