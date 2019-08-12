import * as React from 'react';

import {Select, Option} from '@root/components/core/select';
import {StatsPeriod} from '@root/lib/statistics/period';

interface StatsPeriodDropdownProps {
  statsPeriods: StatsPeriod[];
  selected: StatsPeriod;
  onChange(newStatPeriod: StatsPeriod): void;
}

export class StatsPeriodDropdown extends React.Component<StatsPeriodDropdownProps> {
  public static displayName = 'StatsPeriodDropdown';

  public render(): JSX.Element {
    const {statsPeriods, selected, onChange} = this.props;
    return (
      <Select
        style={{width: 180}}
        onChange={event => onChange(statsPeriods.filter(sp => sp.name === event.target.value)[0])}
        value={selected.name}
      >
        {statsPeriods.map(statsPeriod => (
          <Option key={statsPeriod.name} value={statsPeriod.name}>
            {statsPeriod.label}
          </Option>
        ))}
      </Select>
    );
  }
}
