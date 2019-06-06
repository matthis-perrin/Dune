import * as React from 'react';
import styled from 'styled-components';

import {HorizontalCote} from '@root/components/common/cote';
import {AutoFontWeight} from '@root/components/core/auto_font_weight';
import {CAPACITE_MACHINE} from '@root/lib/constants';
import {theme} from '@root/theme/default';

import {Refente as RefenteModel} from '@shared/models';

interface RefenteProps {
  refente: RefenteModel;
  pixelPerMM: number;
}

export class Refente extends React.Component<RefenteProps> {
  public static displayName = 'Refente';

  private renderDecalage(decalage?: number): JSX.Element {
    const {pixelPerMM} = this.props;
    if (!decalage) {
      return <React.Fragment />;
    }
    return (
      <HorizontalCote
        fontSize={theme.refente.baseFontSize * pixelPerMM}
        size={decalage}
        pixelPerMM={pixelPerMM}
      />
    );
  }

  private renderChute(chute?: number): JSX.Element {
    const {pixelPerMM} = this.props;
    if (!chute) {
      return <React.Fragment />;
    }
    const basePadding = 6;
    return (
      <Chute style={{width: chute * pixelPerMM, height: theme.refente.height * pixelPerMM}}>
        <ChuteInner
          fontSize={theme.refente.baseFontSize * pixelPerMM}
          style={{padding: basePadding * pixelPerMM}}
        >
          {chute}
        </ChuteInner>
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
        fontSize={theme.refente.baseFontSize * pixelPerMM}
        style={{
          width: laize * pixelPerMM,
          height: theme.refente.height * pixelPerMM,
          borderLeft: `solid ${leftBorder ? 1 : 0}px ${theme.refente.borderColor}`,
        }}
      >
        {laize}
      </Laize>
    );
  }

  public render(): JSX.Element {
    const {refente, pixelPerMM} = this.props;

    return (
      <RefenteContainer style={{width: CAPACITE_MACHINE * pixelPerMM}}>
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
  justify-content: flex-end;
  background-color: #bbffbb;
`;

const Laize = styled(AutoFontWeight)`
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  background-color: ${theme.refente.backgroundColor};
  border: solid 1px ${theme.refente.borderColor};
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

const ChuteInner = styled(AutoFontWeight)`
    background-color: ${theme.refente.chuteBackgroundColor}
    border-radius: 14px;
`;
