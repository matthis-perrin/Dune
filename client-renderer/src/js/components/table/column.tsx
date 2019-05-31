import * as React from 'react';
import Popup from 'reactjs-popup';
import styled from 'styled-components';

import {SVGIcon} from '@root/components/core/svg_icon';
import {ColumnFilterPane} from '@root/components/table/column_filters';
import {ColumnFilter} from '@root/components/table/sortable_table';
import {theme} from '@root/theme/default';

const {filterIconOpacity, filterIconHoverOpacity, filterIconSelectedOpacity} = theme.table;

export type ColumnSortMode = 'asc' | 'desc' | 'none';
export enum ColumnType {
  String,
  Number,
  Date,
  Boolean,
}

interface ColumnHeaderProps<T, U> {
  sort: ColumnSortMode;
  type: ColumnType;
  title: string;
  isFirst: boolean;
  isLast: boolean;
  onClick?(evt: React.MouseEvent): void;
  data: T[];
  filter?: ColumnFilter<T, U>;
  onColumnFilterChange(filter: (row: T) => boolean): void;
}

interface ColumnHeaderState {
  isFilteringOpened: boolean;
  isFilterEnabled: boolean;
}

export class ColumnHeader<T, U> extends React.Component<
  ColumnHeaderProps<T, U>,
  ColumnHeaderState
> {
  private readonly columnFilterRef = React.createRef<HTMLDivElement>();

  public constructor(props: ColumnHeaderProps<T, U>) {
    super(props);
    this.state = {
      isFilteringOpened: false,
      isFilterEnabled: false,
    };
  }

  private readonly handleColumnClick = (event: React.MouseEvent<HTMLDivElement>): void => {
    const {onClick} = this.props;
    const filterButton = this.columnFilterRef.current;
    if (filterButton) {
      let eventHappenedInFilter = false;
      let eventTarget: Element | null = event.target as Element;
      while (eventTarget !== null) {
        if (eventTarget === filterButton || eventTarget.classList.contains('popup-overlay')) {
          eventHappenedInFilter = true;
          break;
        }
        eventTarget = eventTarget.parentElement;
      }
      if (onClick && !eventHappenedInFilter) {
        onClick(event);
      }
    } else if (onClick) {
      onClick(event);
    }
  };

  private readonly handleFilterColumnChange = (
    filterFn: (row: T) => boolean,
    isEnabled: boolean
  ): void => {
    this.setState({
      isFilterEnabled: isEnabled,
    });
    this.props.onColumnFilterChange(filterFn);
  };

  public render(): JSX.Element {
    const {sort, title, type, isFirst, isLast, data, filter} = this.props;
    const {isFilteringOpened, isFilterEnabled} = this.state;

    const titleWrapper = <TitleWrapper>{title}</TitleWrapper>;
    const icon =
      sort === 'none' ? (
        <React.Fragment />
      ) : sort === 'desc' ? (
        <SortingIcon name="caret-down" width={theme.table.headerIconSize} />
      ) : (
        <SortingIcon name="caret-up" width={theme.table.headerIconSize} />
      );

    const filterButton = filter ? (
      <Popup
        onOpen={() => this.setState({isFilteringOpened: true})}
        onClose={() => this.setState({isFilteringOpened: false})}
        trigger={
          <FilteringIcon
            minOpacity={
              isFilteringOpened || isFilterEnabled ? filterIconSelectedOpacity : filterIconOpacity
            }
            ref={this.columnFilterRef}
          >
            <SVGIcon width={12} height={12} name="filter" />
          </FilteringIcon>
        }
      >
        <ColumnFilterPane data={data} filter={filter} onChange={this.handleFilterColumnChange} />
      </Popup>
    ) : (
      <React.Fragment />
    );

    const wrapperProps = {isFirst, isLast, onClick: this.handleColumnClick};
    if (type === ColumnType.Number) {
      return (
        <NumberColumnHeaderWrapper {...wrapperProps}>
          {titleWrapper}
          {filterButton}
          {icon}
        </NumberColumnHeaderWrapper>
      );
    }
    return (
      <ColumnHeaderWrapper {...wrapperProps}>
        {titleWrapper}
        {filterButton}
        {icon}
      </ColumnHeaderWrapper>
    );
  }
}

const FilteringIcon = styled.div<{minOpacity: number}>`
  padding: 8px 8px 6px 8px;
  fill: ${theme.table.headerColor};
  ${props => `opacity: ${props.minOpacity}`}
  :hover {
    ${props => `opacity: ${Math.max(props.minOpacity, filterIconHoverOpacity)}`}
  }
`;

const SortingIcon = styled(SVGIcon)`
  flex-shrink: 0;
  fill: ${theme.table.headerColor};
  margin-left: ${theme.table.headerIconSpacing}px;
`;

const TitleWrapper = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ColumnHeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  height: ${theme.table.headerHeight}px;
  color: ${theme.table.headerColor};
  box-sizing: border-box;
  ${(props: {isFirst: boolean; isLast: boolean}) => `
    padding-left: ${props.isFirst ? theme.table.headerPadding : theme.table.headerPadding / 2}px;
    padding-right: ${props.isLast ? theme.table.headerPadding : theme.table.headerPadding / 2}px;
  `}
  cursor: pointer;
  font-size: ${theme.table.headerFontSize}px;
  font-weight: ${theme.table.headerFontWeight};
  user-select: none;
`;

const NumberColumnHeaderWrapper = styled(ColumnHeaderWrapper)`
  justify-content: flex-end;
`;
