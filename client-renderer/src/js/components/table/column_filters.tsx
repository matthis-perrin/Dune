import * as React from 'react';
import styled from 'styled-components';

import {Checkbox} from '@root/components/core/checkbox';
import {ColumnMetadata} from '@root/components/table/sortable_table';
import {Colors, Palette, theme} from '@root/theme';

// tslint:disable-next-line:no-any
export type FilterStateData = any;

export interface FilterState<T> {
  filterFn(row: T): boolean;
  filterStateData?: FilterStateData;
}

interface ColumnFilterProps<T, U> {
  data: T[];
  filterData: FilterStateData;
  column: ColumnMetadata<T, U>;
  onChange(state: FilterState<T>, isEnabled: boolean): void;
}

export class ColumnFilterPane<T, U> extends React.Component<ColumnFilterProps<T, U>> {
  public static displayName = 'ColumnFilter';

  public render(): JSX.Element {
    const filter = this.props.column.filter;
    if (!filter) {
      return <React.Fragment />;
    }
    const {filterType = 'group'} = filter;
    if (filterType === 'group') {
      return (
        <GroupedColumnFilterPane
          {...this.props}
          enabledValues={this.props.filterData as Map<U, void>}
        />
      );
    }

    return <div> {`Unknown filter type: ${filter.filterType}`}</div>;
  }
}

interface GroupInfo {
  count: number;
  element: JSX.Element;
  isSelected: boolean;
}

interface GroupedColumnFilterPaneProps<T, U> extends ColumnFilterProps<T, U> {
  enabledValues?: Map<U, void>;
}

interface GroupedColumnFilterPaneState<U> {
  groups: Map<U, GroupInfo>;
}

class GroupedColumnFilterPane<T, U> extends React.Component<
  GroupedColumnFilterPaneProps<T, U>,
  GroupedColumnFilterPaneState<U>
> {
  public static displayName = 'GroupedColumnFilterPane';

  public constructor(props: GroupedColumnFilterPaneProps<T, U>) {
    super(props);
    this.state = {
      groups: this.regenerateGroups(props.enabledValues),
    };
  }

  public componentDidUpdate(prevProps: ColumnFilterProps<T, U>): void {
    if (prevProps.column !== this.props.column || prevProps.data !== this.props.data) {
      this.setState({groups: this.regenerateGroups(this.getEnabledValues(this.state.groups))});
    }
  }

  private regenerateGroups(enabledValues?: Map<U, void>): Map<U, GroupInfo> {
    const {column, data} = this.props;
    const newInfos = new Map<U, GroupInfo>();
    if (!column.filter) {
      return newInfos;
    }
    const {getValue, render} = column.filter;
    data.forEach(row => {
      const value = getValue(row);
      const newInfo = newInfos.get(value);
      if (!newInfo) {
        const isSelected = enabledValues ? enabledValues.has(value) : true;
        const element = render ? render(row, value) : column.renderCell(row);
        newInfos.set(value, {count: 1, isSelected, element});
      } else {
        newInfo.count++;
      }
    });
    return newInfos;
  }

  private sortValues<S>(values: S[], sortFn?: (v1: S, v2: S) => number): S[] {
    if (values.length === 0) {
      return values;
    }
    if (sortFn) {
      return values.sort(sortFn);
    }
    const valueType = typeof values[0];
    if (valueType === 'number' || valueType === 'bigint') {
      return values.sort();
    }
    if (valueType === 'string') {
      return values.sort((a, b) =>
        ((a as unknown) as string).localeCompare((b as unknown) as string)
      );
    }
    if (valueType === 'boolean') {
      return values.sort((a, b) => {
        const aa = (a as unknown) as boolean;
        const bb = (b as unknown) as boolean;
        return aa === bb ? 0 : aa ? -1 : 1;
      });
    }
    return values;
  }

  private allChecked(): boolean {
    for (const info of this.state.groups.values()) {
      if (!info.isSelected) {
        return false;
      }
    }
    return true;
  }

  private noneChecked(): boolean {
    for (const info of this.state.groups.values()) {
      if (!info.isSelected) {
        return true;
      }
    }
    return false;
  }

  private getEnabledValues(groups: Map<U, GroupInfo>): Map<U, void> {
    const enabledValues = new Map<U, void>();
    for (const [value, info] of this.state.groups.entries()) {
      if (info.isSelected) {
        enabledValues.set(value);
      }
    }
    return enabledValues;
  }

  private notifyHandler(): void {
    const enabledValues = this.getEnabledValues(this.state.groups);
    const {filter} = this.props.column;
    if (!filter) {
      return;
    }
    const {getValue} = filter;
    const filterFn = (row: T) => enabledValues.has(getValue(row));
    this.props.onChange({filterFn, filterStateData: enabledValues}, !this.allChecked());
  }

  private toggleValue(value: U): void {
    const info = this.state.groups.get(value);
    if (info) {
      info.isSelected = !info.isSelected;
      this.forceUpdate();
      this.notifyHandler();
    }
  }

  private setAll(value: boolean): void {
    this.state.groups.forEach(info => (info.isSelected = value));
    this.forceUpdate();
    this.notifyHandler();
  }

  private renderCheckboxAll(): JSX.Element {
    const allChecked = this.allChecked();
    return (
      <label key="all">
        <FilterCheckbox
          type="checkbox"
          checked={allChecked}
          onChange={() => this.setAll(this.noneChecked())}
        />
        {`Tous (${this.props.data.length})`}
      </label>
    );
  }

  public render(): JSX.Element {
    const {groups} = this.state;
    const {filter} = this.props.column;

    if (!filter) {
      return <React.Fragment />;
    }

    const values = Array.from(groups.keys());
    const sortedValues = this.sortValues(values, filter.sortValue);
    const checkboxes = sortedValues.map((value, index) => {
      const info = groups.get(value);
      if (!info) {
        return <React.Fragment />;
      }
      const checkbox = (
        <FilterLabel key={index}>
          <FilterCheckbox
            type="checkbox"
            checked={info.isSelected}
            onChange={() => this.toggleValue(value)}
          />
          <FilterRenderedValue>{info.element}</FilterRenderedValue>
          <FilterMatchingCountContainer>
            <FilterMatchingCount>{info.count}</FilterMatchingCount>
          </FilterMatchingCountContainer>
        </FilterLabel>
      );
      return checkbox;
    });
    return (
      <CheckboxList>
        {this.renderCheckboxAll()}
        <CheckboxSeparator />
        {checkboxes}
      </CheckboxList>
    );
  }
}

const FilterLabel = styled.label`
  display: flex;
  align-items: baseline;
  cursor: pointer;
  line-height: initial;
  padding: 4px 8px;
`;

const FilterCheckbox = styled(Checkbox)`
  margin: 0px 4px 0 0;
  position: relative;
  top: 1px;
  flex-shrink: 0;
`;

const FilterRenderedValue = styled.div`
  flex-shrink: 0;
`;

const FilterMatchingCountContainer = styled.div`
  flex-grow: 1;
  display: flex;
  justify-content: flex-end;
`;

const FilterMatchingCount = styled.div`
  line-height: ${theme.table.fitlerCountIndicatorFontSize}px;
  font-size: ${theme.table.fitlerCountIndicatorFontSize}px;
  padding: 2px 4px;
  border-radius: ${theme.table.fitlerCountIndicatorFontSize / 2}px;
  background-color: ${theme.table.fitlerCountIndicatorBackgroundColor};
  color: ${theme.table.fitlerCountIndicatorColor};
`;

const CheckboxSeparator = styled.div`
  height: 1px;
  background-color: ${theme.table.filterSeparatorColor};
  margin: 8px 0;
`;

const CheckboxList = styled.div`
  display: flex;
  flex-direction: column;
  color: ${theme.table.filterTextColor};
`;
