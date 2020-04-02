import React from 'react';
import styled from 'styled-components';

import {Card2} from '@root/components/core/card';
import {ReactProps, DivProps} from '@root/components/core/common';
import {SVGIcon} from '@root/components/core/svg_icon';
import {WithColor} from '@root/components/core/with_colors';

interface Props extends ReactProps, DivProps {
  sommeil?: boolean;
  color?: string;
}

export class ViewerTopBar extends React.Component<Props> {
  public static displayName = 'ViewerTopBar';

  private renderSommeilIndicator(): JSX.Element {
    const {sommeil, color} = this.props;
    if (!sommeil) {
      return <React.Fragment />;
    }
    return (
      <WithColor color={color}>
        {(colorData) => (
          <SommeilIndicator>
            <SVGIcon name="zzz" width={16} height={16} />
            <SommeilIndicatorText style={{color: colorData.textHex}}>
              En sommeil
            </SommeilIndicatorText>
          </SommeilIndicator>
        )}
      </WithColor>
    );
  }

  public render(): JSX.Element {
    const {children, color} = this.props;
    return (
      <WithColor color={color}>
        {(colorData) => (
          <ViewerTopBarWrapper
            style={{color: colorData.textHex, backgroundColor: colorData.backgroundHex}}
          >
            {this.renderSommeilIndicator()}
            {children}
          </ViewerTopBarWrapper>
        )}
      </WithColor>
    );
  }
}

const SommeilIndicator = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 32px;
`;

const SommeilIndicatorText = styled.div`
  font-size: 14px;
  margin-left: 8px;
`;

const ViewerTopBarWrapper = styled(Card2)`
  position: relative;
  padding: 0 16px;
  height: 72px;
  font-size: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
