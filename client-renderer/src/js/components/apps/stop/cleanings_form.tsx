import React from 'react';
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

const COLUMN_COUNT = 2;

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
      const checked: Cleaning | undefined = allCleanings.filter(cleaning => cleaning.name === name
      )[0];
      newCleanings.push(checked);
      onChange(newCleanings);
    } else {
      onChange(cleanings.filter(cleaning => cleaning.name !== name));
    }
  };

  private renderCleaning(cleaning: Cleaning, index: number): JSX.Element {
    const {cleanings} = this.props;
    const isChecked = cleanings.map(r => r.name).indexOf(cleaning.name) !== -1;
    return (
      <CheckboxLabel key={cleaning.name}>
        <StyledCheckbox
          type="checkbox"
          checked={isChecked}
          onChange={this.handleCheckboxChanged(cleaning.name)}
        />
        {cleaning.label}
      </CheckboxLabel>
    );
  }

  public render(): JSX.Element {
    const {allCleanings = []} = this.state;

    const rowCount = Math.ceil(allCleanings.length / COLUMN_COUNT);
    const layoutStyles: React.CSSProperties = {
      display: 'grid',
      gridTemplateColumns: `repeat(${COLUMN_COUNT}, auto)`,
      gridTemplateRows: `repeat(${rowCount}, auto)`,
    };

    return (
      <Layout style={layoutStyles}>
        {allCleanings.map((cleaning, index) => this.renderCleaning(cleaning, index))}
      </Layout>
    );
  }
}

const Layout = styled.div``;

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
