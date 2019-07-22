import * as React from 'react';
import styled from 'styled-components';

import {Checkbox} from '@root/components/core/checkbox';
import {unplannedStopsStore} from '@root/stores/data_store';
import {Colors} from '@root/theme';

import {Stop, UnplannedStop} from '@shared/models';

interface StopOtherReasonsFormProps {
  stop: Stop;
  otherReasons: UnplannedStop[];
  onChange(newReasons: UnplannedStop[]): void;
}

interface StopOtherReasonsFormState {
  unplannedStops?: UnplannedStop[];
}

export class StopOtherReasonsForm extends React.Component<
  StopOtherReasonsFormProps,
  StopOtherReasonsFormState
> {
  public static displayName = 'StopOtherReasonsForm';

  public constructor(props: StopOtherReasonsFormProps) {
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
      unplannedStops: unplannedStopsStore.getData(),
    });
  };

  private readonly handleCheckboxChanged = (name: string) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const {onChange, otherReasons} = this.props;
    const {unplannedStops = []} = this.state;
    if (event.target.checked) {
      const newOtherReasons = [...otherReasons];
      const checked: UnplannedStop | undefined = unplannedStops.filter(
        stop => stop.name === name
      )[0];
      newOtherReasons.push(checked);
      onChange(newOtherReasons);
    } else {
      onChange(otherReasons.filter(stop => stop.name !== name));
    }
  };

  private orderStopsByGroup(): UnplannedStop[][] {
    const {unplannedStops} = this.state;
    if (!unplannedStops) {
      return [];
    }
    const byGroup = new Map<string, {stops: UnplannedStop[]; minOrder: number}>();
    unplannedStops.forEach(unplannedStop => {
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
    const {otherReasons} = this.props;
    const isChecked = otherReasons.map(r => r.name).indexOf(stop.name) !== -1;
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
  justify-content: space-around;
`;

const Group = styled.div`
  display: flex;
  flex-direction: column;
  color: ${Colors.TextOnPrimary};
  margin-bottom: 16px;
  margin-right: 16px;
`;

const GroupTitle = styled.div`
  font-size: 18px;
  margin-bottom: 4px;
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
