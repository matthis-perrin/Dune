import {omit} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {HorizontalCote} from '@root/components/common/cote';
import {DivProps} from '@root/components/core/common';
import {CAPACITE_MACHINE} from '@root/lib/constants';
import {theme, couleurByName, textColorByName} from '@root/theme';

import {getPoseSize} from '@shared/lib/cliches';
import {EncrierColor} from '@shared/lib/encrier';
import {firstBobinePlacementAvailableOnRefente, getRefenteSize} from '@shared/lib/refentes';
import {BobineFilleWithPose, Refente} from '@shared/models';

interface EncrierProps extends DivProps {
  pixelPerMM: number;
  selectedBobines: BobineFilleWithPose[];
  selectedRefente?: Refente;
  encrierColor: EncrierColor;
}

const ENCRIER_CONTENT_HEIGHT = 100;
const ENCRIER_MARGIN = 20;
export const ENCRIER_HEIGHT = ENCRIER_CONTENT_HEIGHT + ENCRIER_MARGIN;

export class Encrier extends React.Component<EncrierProps> {
  public static displayName = 'Encrier';

  private renderEmptySpot(size: number, index: number = -1): JSX.Element {
    const {pixelPerMM} = this.props;
    return (
      <EncrierEmptySpot
        key={`empty-spot-${index}`}
        style={{width: size * pixelPerMM, height: ENCRIER_CONTENT_HEIGHT}}
      />
    );
  }

  private renderEmptyEncrier(): JSX.Element {
    const {pixelPerMM, selectedRefente} = this.props;

    const size = selectedRefente
      ? getRefenteSize(selectedRefente) - (selectedRefente.chute || 0)
      : CAPACITE_MACHINE;
    const elements: JSX.Element[] = [
      <EmptyEncrier
        key={'empty-encrier'}
        style={{width: size * pixelPerMM, height: ENCRIER_CONTENT_HEIGHT}}
      >
        Encrier vide
      </EmptyEncrier>,
    ];

    return <React.Fragment>{elements}</React.Fragment>;
  }

  private getRefClicheInEncrierForBobine(bobine: BobineFilleWithPose): string | undefined {
    const {encrierColor} = this.props;
    if (bobine.refCliche1 && encrierColor.refsCliche.indexOf(bobine.refCliche1) !== -1) {
      return bobine.refCliche1;
    }
    if (bobine.refCliche2 && encrierColor.refsCliche.indexOf(bobine.refCliche2) !== -1) {
      return bobine.refCliche2;
    }
    return undefined;
  }

  private renderForBobineWithPose(bobine: BobineFilleWithPose, index: number): JSX.Element {
    const {pixelPerMM, encrierColor} = this.props;
    const {laize, pose} = bobine;
    const poseSize = getPoseSize(pose);
    const size = (laize || 0) * poseSize;
    const refCliche = this.getRefClicheInEncrierForBobine(bobine);
    if (!refCliche) {
      return this.renderEmptySpot(size, index);
    }
    return (
      <EncrierClicheSpot
        key={`cliche-${refCliche}-${pose}-${index}`}
        style={{
          width: size * pixelPerMM,
          height: ENCRIER_CONTENT_HEIGHT,
          backgroundColor: couleurByName(encrierColor.color),
          color: textColorByName(encrierColor.color),
        }}
      >{`${refCliche} (${poseSize} poses)`}</EncrierClicheSpot>
    );
  }

  private renderWithRefente(refente: Refente): JSX.Element {
    const {selectedBobines} = this.props;
    const elements: JSX.Element[] = [];

    if (selectedBobines.length === 0) {
      elements.push(this.renderEmptySpot(CAPACITE_MACHINE));
    } else {
      const placement = firstBobinePlacementAvailableOnRefente(selectedBobines, refente);
      for (let i = 0; i < placement.length; i++) {
        const spot = placement[i];
        if (typeof spot === 'number') {
          elements.push(this.renderEmptySpot(spot, i));
        } else {
          elements.push(this.renderForBobineWithPose(spot, i));
        }
      }
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
        {this.renderEmptySpot(CAPACITE_MACHINE - selectedBobinesSize)}
      </React.Fragment>
    );
  }

  public render(): JSX.Element {
    const {selectedRefente, encrierColor, pixelPerMM} = this.props;
    const content =
      encrierColor.color === ''
        ? this.renderEmptyEncrier()
        : selectedRefente
        ? this.renderWithRefente(selectedRefente)
        : this.renderWithoutRefente();
    const rest = omit(this.props, [
      'pixelPerMM',
      'selectedBobines',
      'selectedRefente',
      'encrierColor',
    ]);
    const decalage =
      selectedRefente && selectedRefente.decalage ? (
        <HorizontalCote
          key="decalage"
          fontSize={theme.refente.baseFontSize * pixelPerMM}
          size={selectedRefente.decalage}
          pixelPerMM={pixelPerMM}
        />
      ) : (
        <React.Fragment />
      );
    return (
      <div style={{display: 'flex', flexDirection: 'column'}}>
        <div style={{height: ENCRIER_MARGIN / 2}} />
        <Container>
          <EncrierWrapper {...rest}>{content}</EncrierWrapper>
          {decalage}
        </Container>
        <div style={{height: ENCRIER_MARGIN / 2}} />
      </div>
    );
  }
}
const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: -1px;
  &:first-of-type {
    margin-top: 0;
  }
`;

const EncrierWrapper = styled.div`
  display: flex;
  border: solid ${theme.planProd.selectedStrokeWidth}px ${theme.planProd.selectedBorderColor};
  box-sizing: border-box;
`;

const EncrierContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const EmptyEncrier = styled(EncrierContent)`
  font-style: italic;
  color: ${theme.planProd.selectedBorderColor};
`;

const EncrierEmptySpot = styled(EncrierContent)`
  border-left: solid 1px transparent;
  border-right: solid 1px transparent;
  box-sizing: border-box;
  margin-left: -1px;
`;

const EncrierClicheSpot = styled(EncrierContent)`
  border-left: solid 1px black;
  border-right: solid 1px black;
  box-sizing: border-box;
  margin-left: -1px;
`;
