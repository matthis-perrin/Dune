import {range} from 'lodash-es';
import * as React from 'react';
import {GridChildComponentProps, VariableSizeGrid} from 'react-window';
import styled from 'styled-components';

import {theme} from '@root/theme/default';

interface Props {
  width: number;
  height: number;
  columnCount: number;
  rowCount: number;
  getColumnWidth(index: number, width: number): number;
  rowHeight: number;
  renderCell(props: GridChildComponentProps): JSX.Element;
  renderColumn(index: number): JSX.Element;
  style?: React.CSSProperties;
}

export class VirtualizedTable extends React.Component<Props> {
  public static displayName = 'VirtualizedTable';

  private readonly gridRef = React.createRef<VariableSizeGrid>();

  public componentDidUpdate(prevProps: Props): void {
    if (this.props.width !== prevProps.width && this.gridRef.current) {
      this.gridRef.current.resetAfterColumnIndex(0);
    }
  }

  public render(): JSX.Element {
    const {
      width,
      height,
      columnCount,
      rowCount,
      getColumnWidth,
      rowHeight,
      renderCell,
      renderColumn,
      style,
    } = this.props;

    return (
      <div>
        <ColumnContainer width={width}>
          {range(columnCount).map(i => (
            <div key={`column-${i}`} style={{width: getColumnWidth(i, width)}}>
              {renderColumn(i)}
            </div>
          ))}
        </ColumnContainer>
        <VariableSizeGrid
          ref={this.gridRef}
          width={width}
          height={height}
          columnCount={columnCount}
          rowCount={rowCount}
          columnWidth={index => {
            const w = getColumnWidth(index, width);
            return w > 0 ? w : 0;
          }}
          estimatedColumnWidth={width / columnCount}
          rowHeight={() => rowHeight}
          estimatedRowHeight={rowHeight}
          style={style}
        >
          {renderCell}
        </VariableSizeGrid>
      </div>
    );
  }
}

const ColumnContainer = styled.div<{width: number}>`
  display: flex;
  width: ${props => props.width}px;
  background-color: ${theme.table.headerBackgroundColor};
`;
