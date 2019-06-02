import * as React from 'react';
import styled from 'styled-components';

import {ConstraintDescriptions} from '@root/components/common/operation_constraint';
import {EditableDropdown} from '@root/components/form/editable_dropdown';
import {EditableTextfield} from '@root/components/form/editable_textfield';

import {Operation, OperationConstraint} from '@shared/models';
import {asNumber} from '@shared/type_utils';

interface Props {
  operation: Operation;
  onChange(operation: Operation): void;
}

const operationConstraintValues = Array.from(ConstraintDescriptions.entries()).map(
  ([value, label]) => ({
    label,
    value,
  })
);

export class OperationForm extends React.Component<Props> {
  public static displayName = 'OperationForm';

  private readonly handleDescriptionChange = (description: string): void => {
    this.props.onChange({...this.props.operation, description});
  };

  private readonly handleConstraintChange = (constraint: OperationConstraint): void => {
    this.props.onChange({...this.props.operation, constraint});
  };

  private readonly handleDurationChange = (durationString: string): void => {
    const duration = 60 * 1000 * asNumber(durationString, 0);
    this.props.onChange({...this.props.operation, duration});
  };

  private readonly handleRequiredChange = (required: boolean): void => {
    this.props.onChange({...this.props.operation, required});
  };

  public render(): JSX.Element {
    const {operation} = this.props;

    return (
      <table>
        <tbody>
          <tr>
            <FormLabel>Description</FormLabel>
            <td>
              <EditableTextfield
                value={operation.description}
                onChange={this.handleDescriptionChange}
              />
            </td>
          </tr>
          <tr>
            <FormLabel>Contrainte</FormLabel>
            <td>
              <EditableDropdown
                values={operationConstraintValues}
                value={operation.constraint}
                onChange={this.handleConstraintChange}
              />
            </td>
          </tr>
          <tr>
            <FormLabel>Durée</FormLabel>
            <td>
              <EditableTextfield
                value={String(Math.round(operation.duration / 60 / 1000))}
                validateInput={input => input.replace(/[^0-9]/, '')}
                onChange={this.handleDurationChange}
              />
            </td>
          </tr>
          <tr>
            <FormLabel>Obligatoire</FormLabel>
            <td>
              <EditableDropdown
                values={[{label: 'OUI', value: true}, {label: 'NON', value: false}]}
                value={operation.required}
                onChange={this.handleRequiredChange}
              />
            </td>
          </tr>
        </tbody>
      </table>
    );
  }
}

const FormLabel = styled.td`
  text-align: right;
  font-size: 15px;
  font-weight: 500;
`;
