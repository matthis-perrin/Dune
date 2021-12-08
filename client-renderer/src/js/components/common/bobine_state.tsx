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
  [
    BobineStateModel.Imperatif,
    {title: 'IMPÉRATIF', color: Palette.Black, fontWeight: FontWeight.Bold},
  ],
  [BobineStateModel.Rupture, {title: 'RUPTURE', color: Colors.Danger, fontWeight: FontWeight.Bold}],
  [BobineStateModel.Alerte, {title: 'ALERTE', color: Colors.Danger, fontWeight: FontWeight.Bold}],
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
  info?: string;
}

export class BobineState extends React.Component<BobineStateProps> {
  public static displayName = 'BobineState';

  public render(): JSX.Element {
    const {state, info} = this.props;

    const {title, color, fontWeight} = stateUI.get(state) || unknownStateUI;
    const content = info ? `${title} (${info})` : title;

    return (
      <BobineStateContainer style={{backgroundColor: color, color: Palette.White, fontWeight}}>
        {content}
      </BobineStateContainer>
    );
  }
}

const BobineStateContainer = styled.div`
  padding: 2px 6px;
`;
