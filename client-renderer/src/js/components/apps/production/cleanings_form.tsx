import * as React from 'react';
import styled from 'styled-components';

import {Checkbox} from '@root/components/core/checkbox';
import {cleaningsStore} from '@root/stores/data_store';

import {Stop, Cleaning} from '@shared/models';

interface CleaningsFormProps {
  stop: Stop;
  cleanings: Cleaning[];
  onChange(newCleanings: Cleaning[]): void;
}

interface CleaningsFormState {
  allCleanings?: Cleaning[];
}

export class CleaningsForm extends React.Component<CleaningsFormProps, CleaningsFormState> {
  public static displayName = 'CleaningsForm';

  public constructor(props: CleaningsFormProps) {
    super(props);
    this.state = {};
  }

  public componentDidMount(): void {
    cleaningsStore.addListener(this.handleStoresChanged);
  }

  public componentWillUnmount(): void {
    cleaningsStore.removeListener(this.handleStoresChanged);
  }

  private readonly handleStoresChanged = (): void => {
    this.setState({
      allCleanings: cleaningsStore.getData(),
    });
  };

  private readonly handleCheckboxChanged = (name: string) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const {onChange, cleanings} = this.props;
    const {allCleanings = []} = this.state;
    if (event.target.checked) {
      const newCleanings = [...cleanings];
      const checked: Cleaning | undefined = allCleanings.filter(stop => stop.name === name)[0];
      newCleanings.push(checked);
      onChange(newCleanings);
    } else {
      onChange(cleanings.filter(stop => stop.name !== name));
    }
  };

  private renderCleaning(stop: Cleaning): JSX.Element {
    const {cleanings} = this.props;
    const isChecked = cleanings.map(r => r.name).indexOf(stop.name) !== -1;
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
    const {allCleanings = []} = this.state;
    return <Wrapper>{allCleanings.map(cleaning => this.renderCleaning(cleaning))}</Wrapper>;
  }
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
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
