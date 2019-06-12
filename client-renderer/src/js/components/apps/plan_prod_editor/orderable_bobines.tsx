import * as React from 'react';

import {BobineWithPose} from '@root/components/common/bobine_with_pose';
import {HorizontalCote} from '@root/components/common/cote';
import {DivProps} from '@root/components/core/common';
import {CAPACITE_MACHINE} from '@root/lib/constants';
import {theme} from '@root/theme/default';

import {getPoseSize} from '@shared/lib/cliches';
import {firstBobinePlacementAvailableOnRefente} from '@shared/lib/refentes';
import {BobineFilleWithPose, Refente} from '@shared/models';

interface OrderableBobinesProps extends DivProps {
  pixelPerMM: number;
  bobines: BobineFilleWithPose[];
  refente: Refente;
}

export class OrderableBobines extends React.Component<OrderableBobinesProps> {
  public static displayName = 'OrderableBobines';

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

  public render(): JSX.Element {
    const {bobines} = this.props;
    const elements: JSX.Element[] = bobines.map((b, i) => this.renderBobineWithPose(b, i, true));
    return <React.Fragment>OrderableBobines{elements}</React.Fragment>;
  }
}
