import React from 'react';
import styled from 'styled-components';

interface EditableDropdownProps<T> {
  values: {label: string; value: T}[];
  value: T;
  onChange(newValue: T): void;
}

interface EditableDropdownState {
  isHovered: boolean;
}

export class EditableDropdown<T> extends React.Component<
  EditableDropdownProps<T>,
  EditableDropdownState
> {
  public static displayName = 'EditableDropdown';

  public constructor(props: EditableDropdownProps<T>) {
    super(props);
    this.state = {isHovered: false};
  }

  private readonly handleChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const {onChange} = this.props;
    if (onChange) {
      const label = event.target.value;
      const value = this.getValue(label);
      if (value !== undefined) {
        onChange(value);
      }
    }
  };
  private readonly handleMouseOver = (event: React.MouseEvent<HTMLSelectElement>): void => {
    this.setState({isHovered: true});
  };

  private readonly handleMouseOut = (event: React.MouseEvent<HTMLSelectElement>): void => {
    this.setState({isHovered: false});
  };

  private getLabel(value: T): string {
    for (const info of this.props.values) {
      if (info.value === value) {
        return info.label;
      }
    }
    return '';
  }

  private getValue(label: string): T | undefined {
    for (const info of this.props.values) {
      if (info.label === label) {
        return info.value;
      }
    }
    return undefined;
  }

  public render(): JSX.Element {
    const {values, value} = this.props;
    const {isHovered} = this.state;
    const valueLabel = this.getLabel(value);

    const SelectClass = isHovered ? ActiveSelect : BlankSelect;

    return (
      <SelectClass
        onChange={this.handleChange}
        onMouseOver={this.handleMouseOver}
        onMouseOut={this.handleMouseOut}
        value={valueLabel}
      >
        {values.map(v => (
          <Option key={v.label} value={v.label}>
            {v.label}
          </Option>
        ))}
      </SelectClass>
    );
  }
}

const SelectBase = styled.select`
  font-family: Segoe UI;
  font-size: 15px;
  outline: none;
  width: 100%;
  max-width: 100%;
`;

const BlankSelect = styled(SelectBase)`
  border: none;
  background: transparent;
  -webkit-appearance: none;
  padding: 4px 7px;
  margin-right: 14px;
  width: calc(100% - 14px);
  max-width: calc(100% - 14px);
`;

const ActiveSelect = styled(SelectBase)`
  padding: 2px;
`;

const Option = styled.option``;
