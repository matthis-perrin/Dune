import * as React from 'react';
import Popup from 'reactjs-popup';
import styled from 'styled-components';

import {SVGIcon} from '@root/components/core/svg_icon';
import {
  ColumnFilterPane,
  FilterState,
  FilterStateData,
} from '@root/components/table/column_filters';
import {ColumnFilter} from '@root/components/table/sortable_table';
import {theme} from '@root/theme';

const {filterIconOpacity, filterIconHoverOpacity, filterIconSelectedOpacity} = theme.table;

export type ColumnSortMode = 'asc' | 'desc' | 'none';

interface ColumnHeaderProps<T, U> {
  canSort: boolean;
  sort: ColumnSortMode;
  title: string;
  isFirst: boolean;
  isLast: boolean;
  onClick?(evt: React.MouseEvent): void;
  data: T[];
  filterData?: FilterStateData;
  filter?: ColumnFilter<T, U>;
  onColumnFilterChange(filterState: FilterState<T>): void;
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
    filterState: FilterState<T>,
    isEnabled: boolean
  ): void => {
    this.setState({
      isFilterEnabled: isEnabled,
    });
    this.props.onColumnFilterChange(filterState);
  };

  public render(): JSX.Element {
    const {sort, title, isFirst, isLast, data, filter, filterData, canSort} = this.props;
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
        contentStyle={{cursor: 'default'}}
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
        <ColumnFilterPane
          data={data}
          // tslint:disable-next-line:no-unsafe-any
          filterData={filterData}
          filter={filter}
          onChange={this.handleFilterColumnChange}
        />
      </Popup>
    ) : (
      <React.Fragment />
    );

    const wrapperProps = {
      isFirst,
      isLast,
      onClick: this.handleColumnClick,
      style: {cursor: canSort ? 'pointer' : 'default'},
    };
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
  padding: 9px 8px 6px 8px;
  fill: ${theme.table.headerIconColor};
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
  line-height: ${theme.table.headerHeight}px;
  color: ${theme.table.headerColor};
  box-sizing: border-box;
  ${(props: {isFirst: boolean; isLast: boolean}) => `
    padding-left: ${props.isFirst ? theme.table.headerPadding : theme.table.headerPadding / 2}px;
    padding-right: ${props.isLast ? theme.table.headerPadding : theme.table.headerPadding / 2}px;
  `}
  font-size: ${theme.table.headerFontSize}px;
  font-weight: ${theme.table.headerFontWeight};
  user-select: none;
`;
