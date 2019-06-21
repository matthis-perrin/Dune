import {range, omit} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {Bobine, CURVE_EXTRA_SPACE} from '@root/components/common/bobine';
import {RefLink} from '@root/components/common/ref_link';
import {AutoFontWeight} from '@root/components/core/auto_font_weight';
import {Closable} from '@root/components/core/closable';
import {DivProps} from '@root/components/core/common';
import {bridge} from '@root/lib/bridge';
import {CAPACITE_MACHINE} from '@root/lib/constants';
import {couleurByName, textColorByName, getColorInfoByName, theme} from '@root/theme';

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
    const textColor = textColorByName(bobine.couleurPapier);

    const initialSize = bobine.laize || 0;
    // In order to have overlapping bobines we need make them slightly larger (by the size of the
    // bobine stroke width) and have a negative margin of that size. But since the size is expressed
    // in mm, we need to convert it before substracting.
    const size = initialSize + theme.planProd.selectedStrokeWidth / pixelPerMM;
    const curveOffset = pixelPerMM * CAPACITE_MACHINE * CURVE_EXTRA_SPACE * 2;
    const offset = curveOffset + theme.planProd.selectedStrokeWidth * 2;

    const rest = omit(this.props, ['pixelPerMM', 'bobine', 'negativeMargin', 'style']);
    const style: React.CSSProperties = {
      ...(this.props.style || {}),
      display: 'flex',
    };

    return (
      <ClosableWithHover
        color={getColorInfoByName(bobine.couleurPapier).dangerHex}
        onClose={this.handleClose}
        {...rest}
        style={style}
        offset={curveOffset}
        size={size * poseSize + offset}
      >
        {range(poseSize).map((pose, i) => (
          <Bobine
            key={i}
            style={{marginLeft: negativeMargin || i > 0 ? -offset : 0, zIndex: i + 1}}
            pixelPerMM={pixelPerMM}
            size={size}
            color={color}
            strokeWidth={1}
            faceDown
          >
            <AutoFontWeight fontSize={12 * pixelPerMM} style={{userSelect: 'none'}}>
              <BobineDescription style={{color: textColor}}>
                <RefLink
                  color={textColor}
                  noIcon
                  onClick={() => bridge.viewBobine(bobine.ref).catch(console.error)}
                >
                  {bobine.ref}
                </RefLink>
                <br />
                {`${bobine.laize} - ${bobine.grammage}g`}
              </BobineDescription>
            </AutoFontWeight>
          </Bobine>
        ))}
      </ClosableWithHover>
    );
  }
}

const BobineDescription = styled.div`
  text-align: center;
`;

const ClosableWithHover = styled(Closable)`
  position: relative;
  transition: all 100ms ease-in-out;
  &:hover {
    transform: scale(1.05)
      translate(${props => `${(-((props.size as number) || 0) * 0.05) / 2}px`}, 0);
  }
`;
