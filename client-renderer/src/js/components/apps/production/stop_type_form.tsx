import * as React from 'react';
import styled from 'styled-components';

import {labelForStopType} from '@root/lib/stop';
import {Palette, Colors} from '@root/theme';

import {Stop, StopType} from '@shared/models';

interface StopTypeFormProps {
  stop: Stop;
  type?: StopType;
  planProdId?: string;
  maintenanceId?: string;
  onChange(newType: StopType, newPlanProdId?: string, newMaintenanceId?: string): void;
}

interface StopTypeFormState {}

export class StopTypeForm extends React.Component<StopTypeFormProps, StopTypeFormState> {
  public static displayName = 'StopTypeForm';

  public constructor(props: StopTypeFormProps) {
    super(props);
    this.state = {};
  }

  private readonly handleInputChange = (value: StopType) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.checked) {
      this.props.onChange(value, this.props.planProdId, this.props.maintenanceId);
    }
  };

  private renderOption(value: StopType, extra?: JSX.Element): JSX.Element {
    const {stop, type} = this.props;
    return (
      <OptionLine>
        <RadioLabel htmlFor={value}>
          <RadioInput
            type="radio"
            name={`stop-type-${stop.start}`}
            id={value}
            value={value}
            checked={type === value}
            onChange={this.handleInputChange(value)}
          />
          {labelForStopType.get(value) || ''}
        </RadioLabel>
        {extra}
      </OptionLine>
    );
  }

  public render(): JSX.Element {
    return (
      <OptionWrapper>
        {this.renderOption(StopType.ChangePlanProd)}
        {this.renderOption(StopType.ReprisePlanProd)}
        {this.renderOption(StopType.ChangeBobinePapier)}
        {this.renderOption(StopType.ChangeBobinePolypro)}
        {this.renderOption(StopType.ChangeBobinePapierAndPolypro)}
        {this.renderOption(StopType.EndOfDayEndProd)}
        {this.renderOption(StopType.EndOfDayPauseProd)}
        {this.renderOption(StopType.Unplanned)}
        {this.renderOption(StopType.Maintenance)}
      </OptionWrapper>
    );
  }
}

const OptionWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const OptionLine = styled.div`
  display: flex;
  align-items: center;
`;

const RadioInput = styled.input`
  appearance: none;
  outline: none;

  border-radius: 50%;
  width: 16px;
  height: 16px;
  margin-right: 8px;

  border: 2px solid ${Colors.SecondaryDark};
  background-color: ${Palette.White};
  transition: 0.2s all linear;

  &:checked {
    border: 6px solid ${Colors.SecondaryDark};
  }
`;

const RadioLabel = styled.label`
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px 8px 6px 4px;
  width: 384px;
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;
