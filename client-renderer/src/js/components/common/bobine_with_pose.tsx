import {range, omit} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {Bobine, CURVE_EXTRA_SPACE, BOBINE_STROKE_WIDTH} from '@root/components/common/bobine';
import {AutoFontWeight} from '@root/components/core/auto_font_weight';
import {Closable} from '@root/components/core/closable';
import {DivProps} from '@root/components/core/common';
import {bridge} from '@root/lib/bridge';
import {CAPACITE_MACHINE} from '@root/lib/constants';
import {couleurByName} from '@root/theme/default';

import {getPoseSize} from '@shared/lib/cliches';
import {BobineFilleWithPose} from '@shared/models';

interface BobineWithPoseProps extends DivProps {
  pixelPerMM: number;
  bobine: BobineFilleWithPose;
  negativeMargin: boolean;
}

export class BobineWithPose extends React.Component<BobineWithPoseProps> {
  public static displayName = 'BobineWithPose';

  private readonly handleClose = (): void => {
    const {bobine} = this.props;
    bridge.removePlanBobine(bobine.ref, bobine.pose).catch(console.error);
  };

  public render(): JSX.Element {
    const {bobine, pixelPerMM, negativeMargin} = this.props;
    const poseSize = getPoseSize(bobine.pose);
    const color = couleurByName(bobine.couleurPapier);

    const initialSize = bobine.laize || 0;
    // In order to have overlapping bobines we need make them slightly larger (by the size of the
    // bobine stroke width) and have a negative margin of that size. But since the size is expressed
    // in mm, we need to convert it before substracting.
    const size = initialSize + BOBINE_STROKE_WIDTH / pixelPerMM;
    const curveOffset = pixelPerMM * CAPACITE_MACHINE * CURVE_EXTRA_SPACE * 2;
    const offset = curveOffset + BOBINE_STROKE_WIDTH * 2;

    const rest = omit(this.props, ['pixelPerMM', 'bobine', 'negativeMargin', 'style']);
    const style: React.CSSProperties = {
      ...(this.props.style || {}),
      display: 'flex',
    };

    return (
      <Closable
        onClose={this.handleClose}
        {...rest}
        style={style}
        centeredWithOffset={-curveOffset / 2}
      >
        {range(poseSize).map((pose, i) => (
          <Bobine
            key={i}
            style={{marginLeft: negativeMargin || i > 0 ? -offset : 0, zIndex: i + 1}}
            pixelPerMM={pixelPerMM}
            size={size}
            color={color}
            faceDown
          >
            <AutoFontWeight fontSize={12 * pixelPerMM}>
              <BobineDescription>
                {bobine.ref}
                <br />
                {`${bobine.couleurPapier} - ${bobine.laize}`}
              </BobineDescription>
            </AutoFontWeight>
          </Bobine>
        ))}
      </Closable>
    );
  }
}

const BobineDescription = styled.div`
  text-align: center;
`;
