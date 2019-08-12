import * as React from 'react';

import {Select, Option} from '@root/components/core/select';
import {StatsMetric} from '@root/lib/statistics/metrics';

interface StatsMetricDropdownProps {
  statsMetrics: StatsMetric[];
  selected: StatsMetric;
  onChange(newStatMetric: StatsMetric): void;
}

export class StatsMetricDropdown extends React.Component<StatsMetricDropdownProps> {
  public static displayName = 'StatsMetricDropdown';

  public render(): JSX.Element {
    const {statsMetrics, selected, onChange} = this.props;
    return (
      <Select
        style={{width: 180}}
        onChange={event => onChange(statsMetrics.filter(sp => sp.name === event.target.value)[0])}
        value={selected.name}
      >
        {statsMetrics.map(statsMetric => (
          <Option key={statsMetric.name} value={statsMetric.name}>
            {statsMetric.label}
          </Option>
        ))}
      </Select>
    );
  }
}
