import * as React from 'react';

import {OrderableBobines} from '@root/components/apps/plan_prod_editor/orderable_bobines';
import {SelectBobineButton} from '@root/components/apps/plan_prod_editor/select_buttons';
import {BobineWithPose} from '@root/components/common/bobine_with_pose';
import {HorizontalCote} from '@root/components/common/cote';
import {DivProps} from '@root/components/core/common';
import {CAPACITE_MACHINE} from '@root/lib/constants';
import {theme} from '@root/theme';

import {getPoseSize} from '@shared/lib/cliches';
import {firstBobinePlacementAvailableOnRefente} from '@shared/lib/refentes';
import {BobineFilleWithPose, BobineFilleWithMultiPose, Refente} from '@shared/models';

interface BobinesFormProps extends DivProps {
  pixelPerMM: number;
  selectedBobines: BobineFilleWithPose[];
  selectableBobines: BobineFilleWithMultiPose[];
  selectedRefente?: Refente;
  onReorder(newOrder: BobineFilleWithPose[]): void;
}

export class BobinesForm extends React.Component<BobinesFormProps> {
  public static displayName = 'BobinesForm';

  private renderSelectBobineButton(size: number, index: number): JSX.Element {
    const {selectableBobines, pixelPerMM} = this.props;
    return selectableBobines.length > 0 ? (
      <SelectBobineButton
        key={`select-button-${index}`}
        selectable={selectableBobines}
        pixelPerMM={pixelPerMM}
        size={size}
      />
    ) : (
      <div style={{width: size * pixelPerMM}} />
    );
  }

  private renderBobineWithPose(
    bobine: BobineFilleWithPose,
    index: number,
    negativeMargin: boolean
  ): JSX.Element {
    const {pixelPerMM} = this.props;
    return (
      <BobineWithPose
        key={`${bobine.ref}-${index}`}
        pixelPerMM={pixelPerMM}
        bobine={bobine}
        style={{zIndex: index + 1}}
        negativeMargin={negativeMargin}
      >{`${bobine.ref}-${bobine.pose}`}</BobineWithPose>
    );
  }

  private renderWithRefente(refente: Refente): JSX.Element {
    const {pixelPerMM, selectedBobines, selectableBobines, onReorder} = this.props;
    const placement = firstBobinePlacementAvailableOnRefente(selectedBobines, refente);
    const elements: JSX.Element[] = [];

    if (selectableBobines.length === 0) {
      elements.push(
        <OrderableBobines
          bobines={
            (placement.filter(p => typeof p !== 'number') as unknown) as BobineFilleWithPose[]
          }
          refente={refente}
          pixelPerMM={pixelPerMM}
          onReorder={onReorder}
        />
      );
    } else {
      for (let i = 0; i < placement.length; i++) {
        const spot = placement[i];
        if (typeof spot === 'number') {
          elements.push(this.renderSelectBobineButton(spot, i));
        } else {
          elements.push(this.renderBobineWithPose(spot, i, i > 0 - 1));
        }
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
        {selectedBobines.map((b, i, arr) => this.renderBobineWithPose(b, i, i > 0))}
        {this.renderSelectBobineButton(CAPACITE_MACHINE - selectedBobinesSize, 0)}
      </React.Fragment>
    );
  }

  public render(): JSX.Element {
    const {selectedRefente} = this.props;
    const content = selectedRefente
      ? this.renderWithRefente(selectedRefente)
      : this.renderWithoutRefente();
    return <div style={{display: 'flex'}}>{content}</div>;
  }
}
