import * as React from 'react';
import styled from 'styled-components';

import {labelForStopType} from '@root/lib/stop';
import {Palette, Colors} from '@root/theme';

import {Stop, StopType, ScheduledPlanProd, Maintenance} from '@shared/models';

interface StopTypeFormProps {
  stop: Stop;
  type?: StopType;
  previousStopType?: StopType;
  availablePlanProds: ScheduledPlanProd[];
  availableMaintenances: Maintenance[];
  lastPlanId?: number;
  onChange(newType: StopType, newPlanProdId: number, newMaintenanceId?: number): void;
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
      const {lastPlanId, onChange, availablePlanProds, availableMaintenances} = this.props;
      let planProdId = lastPlanId;
      let maintenanceId: number | undefined;

      if (value === StopType.ChangePlanProd) {
        planProdId = availablePlanProds[0].planProd.id;
      }
      if (value === StopType.Maintenance) {
        maintenanceId = availableMaintenances[0].id;
      }

      if (planProdId === undefined) {
        return;
      }

      onChange(value, planProdId, maintenanceId);
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
    const {availablePlanProds, availableMaintenances, lastPlanId, previousStopType} = this.props;

    const emptyOption = <React.Fragment />;
    const changePlanProdOption =
      availablePlanProds.length > 0 ? this.renderOption(StopType.ChangePlanProd) : emptyOption;

    const reprisePlanProdOption = this.renderOption(StopType.ReprisePlanProd);
    const changeBobinePapierOption = this.renderOption(StopType.ChangeBobinePapier);
    const changeBobinePolyproOption = this.renderOption(StopType.ChangeBobinePolypro);
    const changeBobinePapierAndPolyproOption = this.renderOption(
      StopType.ChangeBobinePapierAndPolypro
    );
    const endOfDayEndProdOption = this.renderOption(StopType.EndOfDayEndProd);
    const endOfDayPauseProdOption = this.renderOption(StopType.EndOfDayPauseProd);
    const unplannedOption = this.renderOption(StopType.Unplanned);

    const maintenanceOption =
      availableMaintenances.length > 0 ? this.renderOption(StopType.Maintenance) : emptyOption;

    // const changePlanProdOption =
    //   availablePlanProds.length > 0 ? (
    //     this.renderOption(StopType.ChangePlanProd)
    //   ) : (
    //     <React.Fragment />
    //   );

    if (lastPlanId === undefined) {
      return <OptionWrapper>{changePlanProdOption}</OptionWrapper>;
    }

    if (previousStopType === StopType.EndOfDayEndProd) {
      return <OptionWrapper>{changePlanProdOption}</OptionWrapper>;
    }

    if (previousStopType === StopType.EndOfDayPauseProd) {
      return <OptionWrapper>{reprisePlanProdOption}</OptionWrapper>;
    }

    if (previousStopType === StopType.ChangePlanProd || previousStopType === StopType.Maintenance) {
      return (
        <OptionWrapper>
          {changePlanProdOption}
          {changeBobinePapierOption}
          {changeBobinePolyproOption}
          {changeBobinePapierAndPolyproOption}
          {endOfDayEndProdOption}
          {endOfDayPauseProdOption}
          {unplannedOption}
          {maintenanceOption}
        </OptionWrapper>
      );
    }

    if (
      previousStopType === undefined ||
      previousStopType === StopType.ChangeBobinePapier ||
      previousStopType === StopType.ChangeBobinePolypro ||
      previousStopType === StopType.ChangeBobinePapierAndPolypro ||
      previousStopType === StopType.Unplanned
    ) {
      return (
        <OptionWrapper>
          {changePlanProdOption}
          {changeBobinePapierOption}
          {changeBobinePolyproOption}
          {changeBobinePapierAndPolyproOption}
          {endOfDayEndProdOption}
          {endOfDayPauseProdOption}
          {unplannedOption}
          {maintenanceOption}
        </OptionWrapper>
      );
    }

    return <OptionWrapper />;
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
