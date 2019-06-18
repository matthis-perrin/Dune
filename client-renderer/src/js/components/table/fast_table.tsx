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

  public shouldComponentUpdate(nextProps: FastTableProps<T>): boolean {
    return (
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
      !isEqualWith(
        this.props.data,
        nextProps.data,
        (row1: T, row2: T): boolean => {
          for (const column of this.props.columns) {
            if (column.shouldRerender(row1, row2)) {
              return false;
            }
          }
          return true;
        }
      )
    );
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
    const additionalStyles: React.CSSProperties = rowStyles ? rowStyles(line) : {};

    const transformedStyles: React.CSSProperties = {
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
      ...additionalStyles,
    };

    return (
      <div
        onClick={event => this.props.onRowClick && this.props.onRowClick(line, event)}
        style={transformedStyles}
      >
        {renderCell(line)}
      </div>
    );
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

    console.log('render');

    return (
      <div>
        <ColumnContainer width={width}>
          {range(columnCount).map(i => (
            <div key={`column-${i}`} style={{width: getColumnWidth(i, width)}}>
              {renderColumn(i)}
            </div>
          ))}
        </ColumnContainer>
        <div style={{width, height, overflow: 'auto'}}>
          <table
            cellPadding={0}
            cellSpacing={0}
            style={{...style, tableLayout: 'fixed', borderCollapse: 'collapse'}}
          >
            {range(rowCount).map(rowIndex => (
              <tr style={{height: rowHeight}}>
                {range(columnCount).map(columnIndex => (
                  <td
                    style={{width: rowIndex === 0 ? getColumnWidth(columnIndex, width) : undefined}}
                  >
                    {this.renderCell({
                      columnIndex,
                      rowIndex,
                    })}
                  </td>
                ))}
              </tr>
            ))}
          </table>
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
