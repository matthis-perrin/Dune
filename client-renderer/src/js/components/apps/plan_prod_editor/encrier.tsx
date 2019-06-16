import * as React from 'react';
import styled from 'styled-components';

import {HorizontalCote} from '@root/components/common/cote';
import {DivProps} from '@root/components/core/common';
import {CAPACITE_MACHINE} from '@root/lib/constants';
import {theme, couleurByName, textColorByName} from '@root/theme/default';

import {getPoseSize} from '@shared/lib/cliches';
import {EncrierColor} from '@shared/lib/encrier';
import {firstBobinePlacementAvailableOnRefente} from '@shared/lib/refentes';
import {BobineFilleWithPose, Refente} from '@shared/models';

interface EncrierProps extends DivProps {
  pixelPerMM: number;
  selectedBobines: BobineFilleWithPose[];
  selectedRefente?: Refente;
  encrierColor: EncrierColor;
}

const ENCRIER_HEIGHT = 40;

export class Encrier extends React.Component<EncrierProps> {
  public static displayName = 'Encrier';

  private renderEmptySpot(size: number, index: number): JSX.Element {
    const {pixelPerMM} = this.props;
    return (
      <div
        key={`empty-spot-${index}`}
        style={{width: size * pixelPerMM, height: ENCRIER_HEIGHT, backgroundColor: 'white'}}
      />
    );
  }

  private renderForBobineWithPose(bobine: BobineFilleWithPose, index: number): JSX.Element {
    const {pixelPerMM, encrierColor} = this.props;
    const {laize, pose} = bobine;
    const poseSize = getPoseSize(pose);
    const size = (laize || 0) * poseSize;
    const refCliche = bobine.refCliche1 || bobine.refCliche2;
    if (!refCliche || encrierColor.refsCliche.indexOf(refCliche) === -1) {
      return this.renderEmptySpot(size, index);
    }
    return (
      <div
        key={`cliche-${refCliche}-${pose}-${index}`}
        style={{
          width: size * pixelPerMM,
          height: ENCRIER_HEIGHT,
          backgroundColor: couleurByName(encrierColor.color),
          color: textColorByName(encrierColor.color),
        }}
      >{`${refCliche} (${poseSize} poses)`}</div>
    );
  }

  private renderWithRefente(refente: Refente): JSX.Element {
    const {pixelPerMM, selectedBobines} = this.props;
    const placement = firstBobinePlacementAvailableOnRefente(selectedBobines, refente);
    const elements: JSX.Element[] = [];

    for (let i = 0; i < placement.length; i++) {
      const spot = placement[i];
      if (typeof spot === 'number') {
        elements.push(this.renderEmptySpot(spot, i));
      } else {
        elements.push(this.renderForBobineWithPose(spot, i));
      }
    }

    if (refente.decalage) {
      elements.push(
        <HorizontalCote
          key="decalage"
          fontSize={theme.refente.baseFontSize * pixelPerMM}
          size={refente.decalage}
          pixelPerMM={pixelPerMM}
        />
      );
    }

    return <React.Fragment>{elements}</React.Fragment>;
  }

  private renderWithoutRefente(): JSX.Element {
    const {selectedBobines} = this.props;
    const selectedBobinesSize = selectedBobines.reduce(
      (acc, b) => acc + (b.laize || 0) * getPoseSize(b.pose),
      0
    );
    return (
      <React.Fragment>
        {selectedBobines.map((b, i) => this.renderForBobineWithPose(b, i))}
        {this.renderEmptySpot(CAPACITE_MACHINE - selectedBobinesSize, -1)}
      </React.Fragment>
    );
  }

  public render(): JSX.Element {
    const {selectedRefente, encrierColor} = this.props;
    const content = selectedRefente
      ? this.renderWithRefente(selectedRefente)
      : this.renderWithoutRefente();
    return (
      <EncrierWrapper key={`${encrierColor.color}-${encrierColor.refsCliche.join(',')}`}>
        {content}
      </EncrierWrapper>
    );
  }
}

const EncrierWrapper = styled.div`
  display: flex;
`;
