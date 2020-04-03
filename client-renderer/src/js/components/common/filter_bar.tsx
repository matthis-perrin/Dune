import {without, isEqual} from 'lodash-es';
import React from 'react';
import styled from 'styled-components';

import {Checkbox} from '@root/components/core/checkbox';
import {theme} from '@root/theme';

type FilterFn<T> = (row: T, filterEnabled: boolean) => boolean;

export interface Filter<T> {
  title: string;
  shouldShowElement: FilterFn<T>;
  enableByDefault: boolean;
}

interface FilterBarProps<T> {
  data: T[];
  filters?: Filter<T>[];
  children(filterBar: JSX.Element, newData: T[]): JSX.Element;
}

interface FilterState<T> {
  enabledFilters: FilterFn<T>[];
  filteredData: T[];
}

export class FilterBar<T> extends React.Component<FilterBarProps<T>, FilterState<T>> {
  public static displayName = 'FilterBar';

  public constructor(props: FilterBarProps<T>) {
    super(props);
    const enabledFilters = (props.filters || [])
      .filter(f => f.enableByDefault)
      .map(f => f.shouldShowElement);
    const filteredData = this.filterData(enabledFilters, props.data);
    this.state = {
      enabledFilters,
      filteredData,
    };
  }

  public componentDidUpdate(prevProps: FilterBarProps<T>): void {
    if (this.props.data !== prevProps.data) {
      const {enabledFilters} = this.state;
      const filteredData = this.filterData(enabledFilters, this.state.filteredData);
      if (filteredData !== this.state.filteredData) {
        this.setState({filteredData});
      }
    }
  }

  private toggleFilter(filter: Filter<T>): void {
    const {enabledFilters} = this.state;

    const fn = filter.shouldShowElement;
    const filterIndex = enabledFilters.indexOf(fn);
    const newEnabledFilters =
      filterIndex === -1 ? enabledFilters.concat([fn]) : without(enabledFilters, fn);
    const filteredData = this.filterData(newEnabledFilters, this.state.filteredData);

    this.setState({enabledFilters: newEnabledFilters, filteredData});
  }

  private filterData(enabledFilters: FilterFn<T>[], current: T[]): T[] {
    const {data, filters = []} = this.props;

    const newData = data.filter(d => {
      for (const filter of filters) {
        if (filter.shouldShowElement(d, enabledFilters.indexOf(filter.shouldShowElement) !== -1)) {
          return true;
        }
      }
      return false;
    });

    const dataIsEqual = isEqual(newData, current);
    return dataIsEqual ? current : newData;
  }

  private renderFilter(filter: Filter<T>): JSX.Element {
    const {shouldShowElement, title} = filter;
    return (
      <FooterLabel key={filter.title}>
        <FooterCheckbox
          type="checkbox"
          checked={this.state.enabledFilters.indexOf(shouldShowElement) !== -1}
          onChange={() => this.toggleFilter(filter)}
        />
        {title}
      </FooterLabel>
    );
  }

  public render(): JSX.Element {
    const {filteredData} = this.state;
    const {filters = [], children} = this.props;
    const formTitle = filters.length > 0 ? 'Afficher: ' : '';
    return children(
      <FooterContainer>
        <FooterForm>
          {formTitle}
          {filters.map(filter => this.renderFilter(filter))}
        </FooterForm>
        <FooterStats>{`Total : ${filteredData.length}`}</FooterStats>
      </FooterContainer>,
      filteredData
    );
  }
}

const FooterCheckbox = styled(Checkbox)`
  margin: 0 4px 0 10px;
`;

const FooterLabel = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
`;

const FooterContainer = styled.div`
  position: fixed;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  width: 100%;
  height: ${theme.table.footerHeight}px;
  box-sizing: border-box;
  font-weight: 600
  font-size: 13px;
  background-color: white;
  user-select: none;
  box-shadow: 0 -1px 3px rgba(0,0,0,0.12), 0 -1px 2px rgba(0,0,0,0.24)
`;

const FooterForm = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  margin-left: 16px;
`;

const FooterStats = styled.div`
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-right: 16px;
  text-align: right;
  font-size: 13px;
`;
