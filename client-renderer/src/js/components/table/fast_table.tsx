import {range, isEqual, memoize} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {ColumnMetadata} from '@root/components/table/sortable_table';
import {theme} from '@root/theme/default';

interface FastTableProps<T extends {ref: string}> {
  width: number;
  height: number;
  columnCount: number;
  rowCount: number;
  getColumnWidth(index: number, width: number): number;
  rowHeight: number;
  renderColumn(index: number): JSX.Element;
  style?: React.CSSProperties;
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
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }
);

export class FastTable<T extends {ref: string}> extends React.Component<FastTableProps<T>> {
  public static displayName = 'FastTable';
  //   private readonly updateIndexTimeout: number | undefined;
  private readonly tableContainerRef = React.createRef<HTMLDivElement>();

  private readonly rows = new Map<
    string,
    {
      data: T;
      rowIndex?: number;
    }
  >();

  private dataIsEqual(data1: T[], data2: T[]): boolean {
    if (data1.length !== data2.length) {
      return false;
    }
    for (let i = 0; i < data1.length; i++) {
      for (const column of this.props.columns) {
        const row1 = data1[i];
        const row2 = data2[i];
        if (!row1 || !row2) {
          return true;
        }
        if (column.shouldRerender(row1, row2)) {
          return false;
        }
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

  public shouldComponentUpdate(nextProps: FastTableProps<T>): boolean {
    const hasChanged =
      this.props.width !== nextProps.width ||
      this.props.height !== nextProps.height ||
      this.props.columnCount !== nextProps.columnCount ||
      this.props.rowCount !== nextProps.rowCount ||
      this.props.getColumnWidth !== nextProps.getColumnWidth ||
      this.props.rowHeight !== nextProps.rowHeight ||
      this.props.renderColumn !== nextProps.renderColumn ||
      this.props.style !== nextProps.style ||
      !isEqual(this.props.columns, nextProps.columns) ||
      this.props.rowStyles !== nextProps.rowStyles ||
      this.props.onRowClick !== nextProps.onRowClick;

    const hasDataChanged = !this.dataIsEqual(this.props.data, nextProps.data);

    if (hasChanged || hasDataChanged) {
      for (const row of this.rows.values()) {
        row.rowIndex = undefined;
      }
      nextProps.data.forEach((data, rowIndex) => this.rows.set(data.ref, {data, rowIndex}));
    }
    return hasChanged || hasDataChanged;
  }

  public render(): JSX.Element {
    const {
      columnCount,
      columns,
      getColumnWidth,
      height,
      renderColumn,
      rowCount,
      rowHeight,
      rowStyles,
      style,
      width,
    } = this.props;

    const columnWidths = range(columnCount).map(index => getColumnWidth(index, width));
    let scrollOffset = 0;
    if (this.tableContainerRef.current) {
      scrollOffset = this.tableContainerRef.current.scrollTop;
    }
    const firstVisibleRowIndex = Math.floor(scrollOffset / rowHeight);
    const lastVisibleRowIndex = firstVisibleRowIndex + Math.ceil(height / rowHeight);

    return (
      <div>
        <ColumnContainer width={width}>
          {range(columnCount).map(i => (
            <div key={`column-${i}`} style={{width: getColumnWidth(i, width)}}>
              {renderColumn(i)}
            </div>
          ))}
        </ColumnContainer>
        <div
          ref={this.tableContainerRef}
          style={{...style, width, height: height - theme.table.headerHeight, overflow: 'auto'}}
        >
          <Table style={{height: rowCount * rowHeight}}>
            {Array.from(this.rows.entries())
              .sort((e1, e2) => getStringHash(e1[0]) - getStringHash(e2[0]))
              .map(([ref, rowData]) => {
                const {rowIndex, data} = rowData;
                const styles: React.CSSProperties = {};
                if (rowIndex) {
                  styles.top = rowIndex * rowHeight;
                  styles.visibility = 'visible';
                }
                return (
                  <RowContainer
                    key={ref}
                    style={styles}
                    onClick={this.getRowClickHandlerForRef(ref)}
                  >
                    <FastTableRow
                      isVisible={
                        rowIndex &&
                        rowIndex >= firstVisibleRowIndex &&
                        rowIndex <= lastVisibleRowIndex
                      }
                      columns={columns}
                      columnWidths={columnWidths}
                      data={data}
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

const RowContainer = styled.div`
  display: flex;
  position: absolute;
  top: -1000px;
`;

const Table = styled.div`
  position: relative;
`;

interface FastTableRowProps<T extends {ref: string}> {
  columns: ColumnMetadata<T, any>[];
  columnWidths: number[];
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
    }
    if (!shouldUpdate) {
      for (const column of this.props.columns) {
        if (column.shouldRerender(this.props.data, nextProps.data)) {
          return true;
        }
      }
    }

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

  public render() {
    const {columns, data, columnWidths, isVisible} = this.props;
    return (
      <React.Fragment>
        {range(columns.length).map(columnIndex => {
          const columnWidth = columnWidths[columnIndex];
          const isFirst = columnIndex === 0;
          const isLast = columnIndex === columns.length - 1;
          const paddingLeft = isFirst ? theme.table.headerPadding : theme.table.headerPadding / 2;
          const paddingRight = isLast ? theme.table.headerPadding : theme.table.headerPadding / 2;

          const cellStyles: React.CSSProperties = {
            paddingLeft,
            paddingRight,
            backgroundColor: isVisible ? 'red' : theme.table.rowBackgroundColor,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            boxSizing: 'border-box',
            fontSize: theme.table.rowFontSize,
            fontWeight: theme.table.rowFontWeight,
            cursor: 'pointer',
            userSelect: 'auto',
            width: columnWidth,
          };
          return (
            <div key={columnIndex} style={cellStyles}>
              <FastTableCell column={columns[columnIndex]} data={data} />
            </div>
          );
        })}
      </React.Fragment>
    );
  }
}

interface FastTableCellProps<T extends {ref: string}> {
  column: ColumnMetadata<T, any>;
  data: T;
}

export class FastTableCell<T extends {ref: string}> extends React.Component<FastTableCellProps<T>> {
  public shouldComponentUpdate(nextProps: FastTableCellProps<T>): boolean {
    return this.props.column.shouldRerender(this.props.data, nextProps.data);
  }

  public render() {
    const {column, data} = this.props;
    return column.renderCell(data);
  }
}
