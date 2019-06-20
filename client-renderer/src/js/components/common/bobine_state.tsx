import * as React from 'react';
import styled from 'styled-components';

import {BobineState as BobineStateModel} from '@shared/models';

const stateDescriptions = new Map<BobineStateModel, string>([
  [BobineStateModel.Rupture, 'Rupture'],
  [BobineStateModel.Alerte, 'Alerte'],
  [BobineStateModel.Neutre, ''],
  [BobineStateModel.Surstock, 'Surstock'],
]);

interface BobineStateProps {
  state: BobineStateModel;
}

export class BobineState extends React.Component<BobineStateProps> {
  public static displayName = 'BobineState';

  public render(): JSX.Element {
    const {state} = this.props;

    let stateString = stateDescriptions.get(state);
    if (stateString === undefined) {
      stateString = 'Unknown';
    }

    return <BobineStateContainer>{stateString}</BobineStateContainer>;
  }
}

const BobineStateContainer = styled.div``;
