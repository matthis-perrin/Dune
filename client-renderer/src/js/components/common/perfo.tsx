import React from 'react';
import styled from 'styled-components';

import {Bague} from '@root/components/common/bague';
import {Cale} from '@root/components/common/cale';
import {CAPACITE_MACHINE} from '@root/lib/constants';

import {Perfo as PerfoModel} from '@shared/models';

interface PerfoProps {
  perfo: PerfoModel;
  pixelPerMM: number;
}

export class Perfo extends React.Component<PerfoProps> {
  public static displayName = 'Perfo';

  private renderCale(cale?: number, isFirst?: boolean): JSX.Element {
    const {pixelPerMM} = this.props;
    if (!cale) {
      return <React.Fragment />;
    }
    return <Cale pixelPerMM={pixelPerMM} size={cale} leftBorder={isFirst} />;
  }

  private renderBague(bague?: number): JSX.Element {
    const {pixelPerMM} = this.props;
    if (!bague) {
      return <React.Fragment />;
    }
    return <Bague pixelPerMM={pixelPerMM} size={bague} />;
  }

  public render(): JSX.Element {
    const {perfo, pixelPerMM} = this.props;

    return (
      <PerfoContainer style={{width: CAPACITE_MACHINE * pixelPerMM}}>
        {this.renderCale(perfo.cale1, true)}
        {this.renderBague(perfo.bague1)}
        {this.renderCale(perfo.cale2)}
        {this.renderBague(perfo.bague2)}
        {this.renderCale(perfo.cale3)}
        {this.renderBague(perfo.bague3)}
        {this.renderCale(perfo.cale4)}
        {this.renderBague(perfo.bague4)}
        {this.renderCale(perfo.cale5)}
        {this.renderBague(perfo.bague5)}
        {this.renderCale(perfo.cale6)}
        {this.renderBague(perfo.bague6)}
        {this.renderCale(perfo.cale7)}
        {this.renderBague(perfo.bague7)}
      </PerfoContainer>
    );
  }
}

const PerfoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
`;
