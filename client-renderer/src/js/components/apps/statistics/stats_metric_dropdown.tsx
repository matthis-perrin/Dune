import React from 'react';
import styled from 'styled-components';

import {Select, Option} from '@root/components/core/select';
import {StatsMetric} from '@root/lib/statistics/metrics';
import {Colors, FontWeight} from '@root/theme';

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
      <StyledSelect
        style={{width: 180}}
        onChange={event =>
          onChange(statsMetrics.filter(sp => sp.name === event.target.value)[0])
        }
        value={selected.name}
      >
        {statsMetrics.map(statsMetric => (
          <Option key={statsMetric.name} value={statsMetric.name}>
            {statsMetric.label}
          </Option>
        ))}
      </StyledSelect>
    );
  }
}

const StyledSelect = styled(Select)`
  background-color: ${Colors.SecondaryDark};
  border: none;
  color: ${Colors.TextOnPrimary};
  font-weight: ${FontWeight.SemiBold};
`;
