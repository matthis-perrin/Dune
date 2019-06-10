import {range, omit} from 'lodash-es';
import * as React from 'react';

import {Bobine, CURVE_EXTRA_SPACE, BOBINE_STROKE_WIDTH} from '@root/components/common/bobine';
import {DivProps} from '@root/components/core/common';
import {CAPACITE_MACHINE} from '@root/lib/constants';
import {getCouleurByName} from '@root/theme/default';

import {getPoseSize} from '@shared/lib/cliches';
import {BobineFilleWithPose} from '@shared/models';

interface BobineWithPoseProps extends DivProps {
  pixelPerMM: number;
  bobine: BobineFilleWithPose;
  negativeMargin: boolean;
}

export class BobineWithPose extends React.Component<BobineWithPoseProps> {
  public static displayName = 'BobineWithPose';

  public render(): JSX.Element {
    const {bobine, pixelPerMM, negativeMargin} = this.props;
    const poseSize = getPoseSize(bobine.pose);
    const color = getCouleurByName(bobine.couleurPapier);

    const initialSize = bobine.laize || 0;
    // Since we are overlapping the bobines we make them slightly larger (by the size of the
    // bobine stroke width). But since the size is expressed in mm, we need to convert it before
    // substracting.
    const size = initialSize + BOBINE_STROKE_WIDTH * pixelPerMM;
    const offset = pixelPerMM * CAPACITE_MACHINE * CURVE_EXTRA_SPACE * 2 + BOBINE_STROKE_WIDTH * 2;

    const rest = omit(this.props, ['pixelPerMM', 'bobine', 'negativeMargin', 'style']);
    const style: React.CSSProperties = {
      ...(this.props.style || {}),
      display: 'flex',
    };

    return (
      <div {...rest} style={style}>
        {range(poseSize).map((pose, i) => (
          <Bobine
            key={i}
            style={{marginRight: negativeMargin || i < poseSize - 1 ? -offset : 0, zIndex: i + 1}}
            pixelPerMM={pixelPerMM}
            size={size}
            color={color}
            faceDown
          >{`${bobine.ref}-${pose}`}</Bobine>
        ))}
      </div>
    );
  }
}
