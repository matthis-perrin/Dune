import * as React from 'react';
import styled from 'styled-components';

import {ColumnFilter} from '@root/components/table/sortable_table';

// tslint:disable-next-line:no-any
export type FilterStateData = any;

export interface FilterState<T> {
  filterFn(row: T): boolean;
  filterStateData?: FilterStateData;
}

interface ColumnFilterProps<T, U> {
  data: T[];
  filterData: FilterStateData;
  filter: ColumnFilter<T, U>;
  onChange(state: FilterState<T>, isEnabled: boolean): void;
}

export class ColumnFilterPane<T, U> extends React.Component<ColumnFilterProps<T, U>> {
  public static displayName = 'ColumnFilter';

  public render(): JSX.Element {
    const {filterType = 'group'} = this.props.filter;
    if (filterType === 'group') {
      return (
        <GroupedColumnFilterPane
          {...this.props}
          enabledValues={this.props.filterData as Map<U, void>}
        />
      );
    }

    return <div> {`Unknown filter type: ${this.props.filter.filterType}`}</div>;
  }
}

interface GroupInfo {
  count: number;
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
    if (prevProps.filter !== this.props.filter || prevProps.data !== this.props.data) {
      this.setState({groups: this.regenerateGroups(this.getEnabledValues(this.state.groups))});
    }
  }

  private regenerateGroups(enabledValues?: Map<U, void>): Map<U, GroupInfo> {
    const {filter, data} = this.props;
    const {getValue} = filter;
    const newInfos = new Map<U, GroupInfo>();
    data.forEach(row => {
      const value = getValue(row);
      const newInfo = newInfos.get(value);
      const count = newInfo ? newInfo.count + 1 : 1;
      const isSelected = enabledValues ? enabledValues.has(value) : true;
      newInfos.set(value, {count, isSelected});
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
    const {getValue} = this.props.filter;
    const filter = (row: T) => enabledValues.has(getValue(row));
    this.props.onChange({filterFn: filter, filterStateData: enabledValues}, !this.allChecked());
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
    const {filter} = this.props;

    const values = Array.from(groups.keys());
    const sortedValues = this.sortValues(values, filter.sortValue);
    const checkboxes = sortedValues.map(value => {
      const info = groups.get(value);
      if (!info) {
        return <React.Fragment />;
      }
      const checkbox = (
        <FilterLabel key={String(value)}>
          <FilterCheckbox
            type="checkbox"
            checked={info.isSelected}
            onChange={() => this.toggleValue(value)}
          />
          {`${String(value)} (${info.count})`}
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

const FilterCheckbox = styled.input`
  margin: 0px 4px 0 0;
  position: relative;
  top: 1px;
`;

const FilterLabel = styled.label`
  display: flex;
  align-items: baseline;
  cursor: pointer;
`;

const CheckboxSeparator = styled.div`
  height: 1px;
  background-color: #aaa;
  margin: 8px 0;
`;

const CheckboxList = styled.div`
  display: flex;
  flex-direction: column;
  padding: 8px;
`;
