import * as React from 'react';
import styled from 'styled-components';

import {Input} from '@root/components/core/input';
import {theme} from '@root/theme/default';

interface EditableTextfieldProps {
  value: string;
  validateInput?(value: string): string;
  onChange(newValue: string): void;
}

interface EditableTextfieldState {
  isEditing: boolean;
  isHovered: boolean;
}

export class EditableTextfield extends React.Component<
  EditableTextfieldProps,
  EditableTextfieldState
> {
  public static displayName = 'EditableTextfield';

  public constructor(props: EditableTextfieldProps) {
    super(props);
    this.state = {isEditing: false, isHovered: false};
  }

  private readonly handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const {onChange, validateInput} = this.props;
    if (onChange) {
      const value = event.target.value;
      const newValue = validateInput ? validateInput(value) : value;
      onChange(newValue);
    }
  };
  private readonly handleMouseOver = (event: React.MouseEvent<HTMLInputElement>): void => {
    this.setState({isHovered: true});
  };

  private readonly handleMouseOut = (event: React.MouseEvent<HTMLInputElement>): void => {
    this.setState({isHovered: false});
  };

  private readonly handleClick = (event: React.MouseEvent<HTMLInputElement>): void => {
    if (!this.state.isEditing) {
      this.setState({isEditing: true});
    }
  };

  private readonly handleBlur = (event: React.FocusEvent<HTMLInputElement>): void => {
    if (this.state.isEditing) {
      this.setState({isEditing: false});
    }
  };

  public render(): JSX.Element {
    const {value} = this.props;
    const {isEditing, isHovered} = this.state;

    const inputProps = {
      type: 'text',
      value,
      placeholder: 'Non renseigné',
      onChange: this.handleChange,
      onBlur: this.handleBlur,
      onMouseOver: this.handleMouseOver,
      onMouseOut: this.handleMouseOut,
      onClick: this.handleClick,
    };

    if (isEditing) {
      return <ActiveInput focusOnMount blurOn={['Escape', 'Enter']} {...inputProps} />;
    }
    if (isHovered) {
      return <HoveredInput readOnly {...inputProps} />;
    }
    return <DisabledInput readOnly {...inputProps} />;
  }
}

const BlankInput = styled(Input)`
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  box-shadow: none;
  outline: none;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  background: none;
  border: solid 1px transparent;
  font-size: 15px;
  border-radius: 4px;
  padding: 4px 6px;
  color: black;
`;

const DisabledInput = styled(BlankInput)``;
const HoveredInput = styled(BlankInput)`
  border: solid 1px ${theme.form.inputBorderColor};
  cursor: pointer;
`;
const ActiveInput = styled(BlankInput)`
  border: solid 1px ${theme.form.inputBorderColor};
  background-color: white;
`;
