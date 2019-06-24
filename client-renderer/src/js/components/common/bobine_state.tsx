import * as React from 'react';
import styled from 'styled-components';

import {Colors, FontWeight, Palette} from '@root/theme';

import {BobineState as BobineStateModel} from '@shared/models';

interface StateUI {
  title: string;
  color: string;
  fontWeight: number;
}

const stateUI = new Map<BobineStateModel, StateUI>([
  [BobineStateModel.Rupture, {title: 'RUPTURE', color: Colors.Danger, fontWeight: FontWeight.Bold}],
  [
    BobineStateModel.Alerte,
    {title: 'ALERTE', color: Colors.Danger, fontWeight: FontWeight.SemiBold},
  ],
  [
    BobineStateModel.Neutre,
    {title: 'EN STOCK', color: Colors.Neutral, fontWeight: FontWeight.SemiBold},
  ],
  [
    BobineStateModel.Surstock,
    {title: 'SURSTOCK', color: Colors.Warning, fontWeight: FontWeight.Bold},
  ],
]);

const unknownStateUI = {
  title: 'Unknown',
  color: Palette.Black,
  fontWeight: FontWeight.Regular,
};

interface BobineStateProps {
  state: BobineStateModel;
}

export class BobineState extends React.Component<BobineStateProps> {
  public static displayName = 'BobineState';

  public render(): JSX.Element {
    const {state} = this.props;

    const {title, color, fontWeight} = stateUI.get(state) || unknownStateUI;

    return (
      <BobineStateContainer style={{backgroundColor: color, color: Palette.White, fontWeight}}>
        {title}
      </BobineStateContainer>
    );
  }
}

const BobineStateContainer = styled.div`
  padding: 2px 6px;
`;
