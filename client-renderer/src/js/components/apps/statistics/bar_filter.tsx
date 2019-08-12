import * as React from 'react';
import styled from 'styled-components';

import {Checkbox} from '@root/components/core/checkbox';
import {MetricFilter} from '@root/lib/statistics/metrics';
import {Palette} from '@root/theme';

interface BarFilterProps {
  barTypes: MetricFilter[];
  checked: string[];
  onChange(newChecked: string[]): void;
}

export class BarFilter extends React.Component<BarFilterProps> {
  public static displayName = 'BarFilter';

  private renderCheckbox(barType: MetricFilter): JSX.Element {
    const {checked, onChange} = this.props;
    const isChecked = checked.indexOf(barType.name) !== -1;
    return (
      <CheckboxLabel key={barType.name}>
        <StyledCheckbox
          type="checkbox"
          checked={checked.indexOf(barType.name) !== -1}
          onChange={() =>
            onChange(
              isChecked ? checked.filter(s => s !== barType.name) : checked.concat(barType.name)
            )
          }
        />
        <CheckboxLabelText style={{backgroundColor: barType.color}}>
          {barType.label}
        </CheckboxLabelText>
      </CheckboxLabel>
    );
  }

  public render(): JSX.Element {
    const {barTypes} = this.props;
    return (
      <BarFilterWrapper>{barTypes.map(barType => this.renderCheckbox(barType))}</BarFilterWrapper>
    );
  }
}

const BarFilterWrapper = styled.div`
  margin: auto;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 16px;
  padding: 4px 8px;
  user-select: none;
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const StyledCheckbox = styled(Checkbox)`
  margin-right: 8px;
`;

const CheckboxLabelText = styled.div`
  color: ${Palette.White};
  padding: 2px 8px;
`;
