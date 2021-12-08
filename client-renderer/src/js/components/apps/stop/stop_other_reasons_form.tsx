import * as React from 'react';
import styled from 'styled-components';

import {Checkbox} from '@root/components/core/checkbox';
import {unplannedStopsStore} from '@root/stores/data_store';
import {Colors} from '@root/theme';

import {Stop, UnplannedStop} from '@shared/models';

interface UnplannedStopsFormProps {
  stop: Stop;
  unplannedStops: UnplannedStop[];
  onChange(newUnplannedStops: UnplannedStop[]): void;
}

interface UnplannedStopsFormState {
  allUnplannedStops?: UnplannedStop[];
}

export class UnplannedStopsForm extends React.Component<
  UnplannedStopsFormProps,
  UnplannedStopsFormState
> {
  public static displayName = 'UnplannedStopsForm';

  public constructor(props: UnplannedStopsFormProps) {
    super(props);
    this.state = {};
  }

  public componentDidMount(): void {
    unplannedStopsStore.addListener(this.handleStoresChanged);
  }

  public componentWillUnmount(): void {
    unplannedStopsStore.removeListener(this.handleStoresChanged);
  }

  private readonly handleStoresChanged = (): void => {
    this.setState({
      allUnplannedStops: unplannedStopsStore.getData(),
    });
  };

  private readonly handleCheckboxChanged =
    (name: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const {onChange, unplannedStops} = this.props;
      const {allUnplannedStops = []} = this.state;
      if (event.target.checked) {
        const newUnplannedStops = [...unplannedStops];
        const checked: UnplannedStop | undefined = allUnplannedStops.filter(
          stop => stop.name === name
        )[0];
        newUnplannedStops.push(checked);
        onChange(newUnplannedStops);
      } else {
        onChange(unplannedStops.filter(stop => stop.name !== name));
      }
    };

  private orderStopsByGroup(): UnplannedStop[][] {
    const {allUnplannedStops} = this.state;
    if (!allUnplannedStops) {
      return [];
    }
    const byGroup = new Map<string, {stops: UnplannedStop[]; minOrder: number}>();
    allUnplannedStops.forEach(unplannedStop => {
      const groupReasons = byGroup.get(unplannedStop.group);
      if (!groupReasons) {
        byGroup.set(unplannedStop.group, {stops: [unplannedStop], minOrder: unplannedStop.order});
      } else {
        groupReasons.stops.push(unplannedStop);
        if (unplannedStop.order < groupReasons.minOrder) {
          groupReasons.minOrder = unplannedStop.order;
        }
      }
    });

    return Array.from(byGroup.values())
      .sort((g1, g2) => g1.minOrder - g2.minOrder)
      .map(group => group.stops.sort((s1, s2) => s1.order - s2.order));
  }

  private renderGroup(group: UnplannedStop[]): JSX.Element {
    if (group.length === 0) {
      return <React.Fragment />;
    }
    return (
      <Group>
        <GroupTitle>{group[0].group}</GroupTitle>
        {group.map(stop => this.renderStopReason(stop))}
      </Group>
    );
  }

  private renderStopReason(stop: UnplannedStop): JSX.Element {
    const {unplannedStops} = this.props;
    const isChecked = unplannedStops.map(r => r.name).indexOf(stop.name) !== -1;
    return (
      <CheckboxLabel key={stop.name}>
        <StyledCheckbox
          type="checkbox"
          checked={isChecked}
          onChange={this.handleCheckboxChanged(stop.name)}
        />
        {stop.label}
      </CheckboxLabel>
    );
  }

  public render(): JSX.Element {
    return <Wrapper>{this.orderStopsByGroup().map(group => this.renderGroup(group))}</Wrapper>;
  }
}

const Wrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
`;

const Group = styled.div`
  display: flex;
  flex-direction: column;
  color: ${Colors.TextOnPrimary};
  margin-bottom: 32px;
  margin-right: 32px;
`;

const GroupTitle = styled.div`
  font-size: 18px;
  margin-bottom: 8px;
`;

const StyledCheckbox = styled(Checkbox)`
  margin-right: 8px;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 16px;
  padding: 4px 8px;
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;
