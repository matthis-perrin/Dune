import * as React from 'react';
import styled from 'styled-components';

import {FilterBar} from '@root/components/common/filter_bar';
import {LoadingIndicator} from '@root/components/core/loading_indicator';
import {bridge} from '@root/lib/bridge';
import {ListStore} from '@root/stores/list_store';
import {theme} from '@root/theme/default';

import {PlanProductionChanged} from '@shared/bridge/commands';
import {PlanProductionState} from '@shared/models';

interface Props<T extends {localUpdate: Date; sommeil: boolean}> {
  getSelectable(planProd: PlanProductionState): T[];
  getHash(value: T): string;
  children(elements: T[], isSelectionnable: (element: T) => boolean): JSX.Element;
  store: ListStore<T>;
  dataFilter?(value: T): boolean;
  title: string;
}

interface State<T extends {localUpdate: Date; sommeil: boolean}> {
  allElements?: T[];
  planProd?: PlanProductionState;
  filteredElements?: T[];
}

export class Picker<T extends {localUpdate: Date; sommeil: boolean}> extends React.Component<
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
    document.title = `${this.props.title} (${planProduction.selectableRefentes.length})`;
    this.setState({planProd: planProduction});
  };

  private readonly handleElementsFiltered = (filteredElements: T[]): void => {
    this.setState({filteredElements});
  };

  public render(): JSX.Element {
    const {children, dataFilter} = this.props;
    const {allElements, planProd, filteredElements = []} = this.state;

    if (!allElements || !planProd) {
      return <LoadingIndicator size="large" />;
    }

    return (
      <PickerWrapper>
        {children(filteredElements, this.isSelectionnable)}
        <FilterBar
          data={allElements.filter(e => !e.sommeil && (!dataFilter || dataFilter(e)))}
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
          onChange={this.handleElementsFiltered}
        />
        ;
      </PickerWrapper>
    );
  }
}

const PickerWrapper = styled.div``;
