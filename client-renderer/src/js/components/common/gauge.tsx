import * as React from 'react';
import styled from 'styled-components';

import {Colors, Palette} from '@root/theme';

interface GaugeProps {
  ratio: number;
  ratioMax: number;
}

const DANGER_TO_WARNING_RATIO = 0.25;
const WARNING_TO_SUCCESS_RATIO = 0.5;

export class Gauge extends React.Component<GaugeProps> {
  public static displayName = 'Gauge';

  private getRatioColor(ratio: number): string {
    if (ratio < DANGER_TO_WARNING_RATIO) {
      return Colors.Danger;
    }
    if (ratio < WARNING_TO_SUCCESS_RATIO) {
      return Palette.Carrot;
    }
    return Palette.Nephritis;
  }

  public render(): JSX.Element {
    const {ratio, ratioMax} = this.props;
    return (
      <GaugeWrapper>
        <GaugeMax style={{left: `calc(${100 * ratioMax}%)`}}>{`${100 *
          ratioMax}% (Max.)`}</GaugeMax>
        <GaugeContent
          style={{right: `calc(${100 * (1 - ratio)}%)`, backgroundColor: this.getRatioColor(ratio)}}
        />
        <GaugeLabel
          style={{
            color: ratio < DANGER_TO_WARNING_RATIO ? Palette.Black : Palette.White,
            left: ratio < DANGER_TO_WARNING_RATIO ? `calc(${100 * ratio}% + 8px)` : 0,
            right: ratio < DANGER_TO_WARNING_RATIO ? '100%' : `calc(${100 * (1 - ratio)}% + 8px)`,
            justifyContent: ratio < DANGER_TO_WARNING_RATIO ? 'flex-start' : 'flex-end',
          }}
        >{`${Math.round(ratio * 1000) / 10}%`}</GaugeLabel>
      </GaugeWrapper>
    );
  }
}

const GaugeWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 32px;
  background-color: ${Palette.White};
`;

const GaugeMax = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  box-sizing: border-box;
  border-left: solid 1px ${Colors.PrimaryDark};
  color: ${Colors.PrimaryDark};
  text-align: center;
  overflow: hidden;
  font-size: 14px;
  line-height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const GaugeContent = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  box-sizing: border-box;
`;
const GaugeLabel = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  box-sizing: border-box;
  display: flex;
  align-items: center;
`;
