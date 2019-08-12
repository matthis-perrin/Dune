import {omit} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {ReactProps, DivProps} from '@root/components/core/common';
import {SVGIcon} from '@root/components/core/svg_icon';
import {Colors, Palette} from '@root/theme';

interface TimeBarProps extends ReactProps, DivProps {
  disabledBackward?: boolean;
  disableForward?: boolean;
  onBackward?(): void;
  onForward?(): void;
}

export class TimeBar extends React.Component<TimeBarProps> {
  public static displayName = 'TimeBar';

  public render(): JSX.Element {
    const {children, onBackward, onForward} = this.props;
    const rest = omit(this.props, ['children']);
    return (
      <TimeBarWrapper {...rest}>
        <NavigationIcon onClick={onBackward}>
          <SVGIcon name="caret-left" width={iconSize} height={iconSize} />
        </NavigationIcon>
        <TimeBarTitle>{children}</TimeBarTitle>
        <NavigationIcon onClick={onForward}>
          <SVGIcon name="caret-right" width={iconSize} height={iconSize} />
        </NavigationIcon>
      </TimeBarWrapper>
    );
  }
}

const iconSize = 16;

const TimeBarWrapper = styled.div`
  height: 64px;
  display: flex;
  justify-content: space-between;
  background-color: ${Colors.PrimaryDark};
  color: ${Colors.TextOnPrimary};
`;

const TimeBarTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
`;

const NavigationIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  width: 48px;
  &:hover svg {
    fill: ${Palette.White};
  }
  svg {
    fill: ${Palette.Clouds};
  }
`;
