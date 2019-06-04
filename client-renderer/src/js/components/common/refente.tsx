import * as React from 'react';
import styled from 'styled-components';

import {theme} from '@root/theme/default';

import {Refente as RefenteModel} from '@shared/models';

interface RefenteProps {
  refente: RefenteModel;
  pixelPerMM: number;
}

const REFENTE_HEIGHT = 80;

export class Refente extends React.Component<RefenteProps> {
  public static displayName = 'Refente';

  private renderDecalage(decalage?: number): JSX.Element {
    const {pixelPerMM} = this.props;
    if (!decalage) {
      return <React.Fragment />;
    }
    return (
      <Decalage style={{width: decalage * pixelPerMM, height: REFENTE_HEIGHT * pixelPerMM}}>
        {`[${decalage}]`}
      </Decalage>
    );
  }

  private renderChute(chute?: number): JSX.Element {
    const {pixelPerMM} = this.props;
    if (!chute) {
      return <React.Fragment />;
    }
    return (
      <Chute style={{width: chute * pixelPerMM, height: REFENTE_HEIGHT * pixelPerMM}}>
        <ChuteInner>{chute}</ChuteInner>
      </Chute>
    );
  }

  private renderLaize(laize?: number, leftBorder?: boolean): JSX.Element {
    const {pixelPerMM} = this.props;
    if (!laize) {
      return <React.Fragment />;
    }
    return (
      <Laize
        leftBorder={leftBorder}
        style={{width: laize * pixelPerMM, height: REFENTE_HEIGHT * pixelPerMM}}
      >
        {laize}
      </Laize>
    );
  }

  public render(): JSX.Element {
    const {refente, pixelPerMM} = this.props;

    return (
      <RefenteContainer style={{fontSize: theme.refente.baseFontSize * pixelPerMM}}>
        {this.renderChute(refente.chute)}
        {this.renderLaize(refente.laize1, !refente.chute)}
        {this.renderLaize(refente.laize2)}
        {this.renderLaize(refente.laize3)}
        {this.renderLaize(refente.laize4)}
        {this.renderLaize(refente.laize5)}
        {this.renderLaize(refente.laize6)}
        {this.renderLaize(refente.laize7)}
        {this.renderDecalage(refente.decalage)}
      </RefenteContainer>
    );
  }
}

const RefenteContainer = styled.div`
  display: flex;
`;

const Laize = styled.div<{leftBorder?: boolean}>`
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  background-color: ${theme.refente.backgroundColor};
  border: solid 1px ${theme.refente.borderColor};
  border-left: solid ${props => (props.leftBorder ? 1 : 0)}px ${theme.refente.borderColor};
`;

const Chute = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  background: repeating-linear-gradient(
    -45deg,
    ${theme.refente.chuteBackgroundColor},
    ${theme.refente.chuteBackgroundColor} ${theme.refente.chuteStripeSpacing}px,
    ${theme.refente.chuteStripeColor} ${theme.refente.chuteStripeSpacing + 1}px,
    ${theme.refente.chuteStripeColor}
      ${theme.refente.chuteStripeSpacing + 1 + theme.refente.chuteStripeSize}px,
    ${theme.refente.chuteBackgroundColor}
      ${theme.refente.chuteStripeSpacing + 1 + theme.refente.chuteStripeSize + 1}px
  );
  border: solid 1px ${theme.refente.borderColor};
`;

const ChuteInner = styled.div`
    background-color: ${theme.refente.chuteBackgroundColor}
    padding: 2px 6px 4px 6px;
    border-radius: 14px;
`;

const Decalage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
`;
