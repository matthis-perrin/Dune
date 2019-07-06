import * as React from 'react';

import {FilterBar} from '@root/components/common/filter_bar';
import {SearchBar} from '@root/components/common/search_bar';
import {LoadingScreen} from '@root/components/core/loading_screen';
import {ColumnMetadata} from '@root/components/table/sortable_table';
import {bridge} from '@root/lib/bridge';
import {ListStore} from '@root/stores/list_store';

import {PlanProductionChanged} from '@shared/bridge/commands';
import {PlanProductionState} from '@shared/models';

interface Props<T extends {localUpdate: number; sommeil: boolean}> {
  getSelectable(planProd: PlanProductionState): T[];
  getHash(value: T): string;
  children(
    elements: T[],
    isSelectionnable: (element: T) => boolean,
    planProduction: PlanProductionState,
    header: JSX.Element,
    footer: JSX.Element
  ): JSX.Element;
  store: ListStore<T>;
  dataFilter?(value: T): boolean;
  title: string;
  // tslint:disable-next-line:no-any
  searchColumns?: ColumnMetadata<T, any>[];
}

interface State<T extends {localUpdate: number; sommeil: boolean}> {
  allElements?: T[];
  planProd?: PlanProductionState;
  filteredElements?: T[];
}

export class Picker<T extends {localUpdate: number; sommeil: boolean}> extends React.Component<
  Props<T>,
  State<T>
> {
  public static displayName = 'Picker';

  constructor(props: Props<T>) {
    super(props);
    this.state = {};
  }

  private readonly isSelectionnable = (value: T): boolean => {
    const {getHash, getSelectable} = this.props;
    const {planProd} = this.state;
    if (!planProd) {
      return false;
    }
    return (
      getSelectable(planProd)
        .map(getHash)
        .indexOf(getHash(value)) !== -1
    );
  };

  private readonly shouldShowSelectionnable = (v: T, e: boolean): boolean => {
    return e && this.isSelectionnable(v);
  };
  private readonly shouldShowNotSelectionnable = (v: T, e: boolean): boolean => {
    return e && !this.isSelectionnable(v);
  };

  public componentDidMount(): void {
    bridge.addEventListener(PlanProductionChanged, this.refreshPlanProduction);
    this.props.store.addListener(this.handleValuesChanged);
    this.refreshPlanProduction().catch(console.error);
  }

  public componentWillUnmount(): void {
    bridge.removeEventListener(PlanProductionChanged, this.refreshPlanProduction);
    this.props.store.removeListener(this.handleValuesChanged);
  }

  private readonly handleValuesChanged = (): void => {
    this.setState({allElements: this.props.store.getData()});
  };

  private readonly refreshPlanProduction = async (): Promise<void> => {
    const planProduction = await bridge.getPlanProduction();
    this.setState({planProd: planProduction});
  };

  public render(): JSX.Element {
    const {children, dataFilter, searchColumns, getSelectable, getHash, title} = this.props;
    const {allElements, planProd} = this.state;

    if (!allElements || !planProd) {
      return <LoadingScreen />;
    }

    // Replace elements in `allElements` by the one in `selectable`
    const selectables = getSelectable(planProd);
    document.title = `${title} (${selectables.length})`;
    const selectableHashes = selectables.map(getHash);
    const mappedElements = allElements.map(e => {
      const index = selectableHashes.indexOf(getHash(e));
      return index === -1 ? e : selectables[index];
    });

    return (
      <FilterBar
        data={mappedElements.filter(e => !e.sommeil && (!dataFilter || dataFilter(e)))}
        filters={[
          {
            enableByDefault: true,
            title: 'Compatibles',
            shouldShowElement: this.shouldShowSelectionnable,
          },
          {
            enableByDefault: false,
            title: 'Non-compatibles',
            shouldShowElement: this.shouldShowNotSelectionnable,
          },
        ]}
      >
        {(filterBar, filteredData) => (
          <SearchBar data={filteredData} columns={searchColumns}>
            {(searchBar, searchedData) => {
              const header = searchColumns ? searchBar : <React.Fragment />;

              return children(searchedData, this.isSelectionnable, planProd, header, filterBar);
            }}
          </SearchBar>
        )}
      </FilterBar>
    );
  }
}
