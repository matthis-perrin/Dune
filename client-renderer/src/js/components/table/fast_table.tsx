import {range, isEqual, isEqualWith} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {ColumnMetadata} from '@root/components/table/sortable_table';
import {theme} from '@root/theme/default';

interface CellProps {
  rowIndex: number;
  columnIndex: number;
}

interface FastTableProps<T> {
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

export class FastTable<T> extends React.Component<FastTableProps<T>> {
  public static displayName = 'FastTable';
  private hasRenderedPreview = false;
  private forceUpdateTimeout: number | undefined;

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
      this.props.columns !== nextProps.columns ||
      this.props.rowStyles !== nextProps.rowStyles ||
      this.props.onRowClick !== nextProps.onRowClick ||
      !this.dataIsEqual(this.props.data, nextProps.data);
    if (hasChanged) {
      this.hasRenderedPreview = false;
      clearTimeout(this.forceUpdateTimeout);
    }
    return hasChanged;
  }

  public componentDidUpdate() {
    this.triggerRerenderIfNeeded();
  }

  public componentDidMount() {
    this.triggerRerenderIfNeeded();
  }

  private triggerRerenderIfNeeded() {
    if (!this.hasRenderedPreview) {
      this.hasRenderedPreview = true;
      this.forceUpdateTimeout = setTimeout(() => this.forceUpdate(), 100);
    }
  }

  private readonly renderCell = (props: CellProps): JSX.Element => {
    const {rowIndex, columnIndex} = props;
    const {columns, rowStyles, data, rowHeight} = this.props;

    const line = data[rowIndex];
    const {renderCell} = columns[columnIndex];
    const isFirst = columnIndex === 0;
    const isLast = columnIndex === columns.length - 1;
    const paddingLeft = isFirst ? theme.table.headerPadding : theme.table.headerPadding / 2;
    const paddingRight = isLast ? theme.table.headerPadding : theme.table.headerPadding / 2;

    const cellStyles: React.CSSProperties = {
      paddingLeft,
      paddingRight,
      backgroundColor: theme.table.rowBackgroundColor,
      lineHeight: `${rowHeight}px`,
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      boxSizing: 'border-box',
      fontSize: theme.table.rowFontSize,
      fontWeight: theme.table.rowFontWeight,
      cursor: 'pointer',
      userSelect: 'auto',
    };
    if (line === undefined) {
      return <div style={{...cellStyles}} />;
    }
    const additionalStyles: React.CSSProperties = rowStyles ? rowStyles(line) : {};
    return <div style={{...cellStyles, ...additionalStyles}}>{renderCell(line)}</div>;
  };

  public render(): JSX.Element {
    const {
      width,
      height,
      columnCount,
      rowCount,
      getColumnWidth,
      rowHeight,
      renderColumn,
      style,
    } = this.props;

    let rowToRender = this.hasRenderedPreview ? rowCount : Math.ceil(height / rowHeight);
    if (rowToRender >= rowCount) {
      rowToRender = rowCount;
      this.hasRenderedPreview = true;
    }

    return (
      <div>
        <ColumnContainer width={width}>
          {range(columnCount).map(i => (
            <div key={`column-${i}`} style={{width: getColumnWidth(i, width)}}>
              {renderColumn(i)}
            </div>
          ))}
        </ColumnContainer>
        <div style={{...style, width, height: height - theme.table.headerHeight, overflow: 'auto'}}>
          <Table>
            {range(rowToRender).map(rowIndex => (
              <Row
                onClick={event => this.props.onRowClick && this.props.onRowClick(line, event)}
                style={{height: rowHeight}}
              >
                {range(columnCount).map(columnIndex => (
                  <Cell style={{width: getColumnWidth(columnIndex, width), height: rowHeight}}>
                    {this.renderCell({columnIndex, rowIndex})}
                  </Cell>
                ))}
              </Row>
            ))}
          </Table>
          {this.hasRenderedPreview ? (
            <React.Fragment />
          ) : (
            <div style={{height: (rowCount - rowToRender) * rowHeight, textAlign: 'center'}}>
              Chargement des lignes suivantes
            </div>
          )}
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

const Table = styled.div``;
const Row = styled.div``;
const Cell = styled.div`
  display: inline-block;
`;
