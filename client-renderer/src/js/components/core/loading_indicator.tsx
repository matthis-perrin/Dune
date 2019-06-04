import * as React from 'react';
import styled, {keyframes} from 'styled-components';

import {theme} from '@root/theme/default';

type LoadingIndicatorSize = 'large' | 'medium' | 'small';

interface LoadingIndicatorProps {
  size: LoadingIndicatorSize | number;
  color?: string;
}

export class LoadingIndicator extends React.Component<LoadingIndicatorProps> {
  public static displayName = 'LoadingIndicator';

  private getSizeInPixel(size: LoadingIndicatorSize): number {
    if (size === 'large') {
      return theme.loadingIndicator.largeSize;
    }
    if (size === 'medium') {
      return theme.loadingIndicator.mediumSize;
    }
    return theme.loadingIndicator.smallSize;
  }

  public render(): JSX.Element {
    const {size, color = theme.loadingIndicator.defaultColor} = this.props;
    const sizeInPixels = typeof size === 'string' ? this.getSizeInPixel(size) : size;
    const numberOfDots = 3;
    const dotSize = Math.round(sizeInPixels / (numberOfDots + 1));
    const [bounceDelay1, bounceDelay2, bounceDelay3] = ['-0.32s', '-0.16s', '0s'];
    const dotProps = {width: dotSize, height: dotSize, backgroundColor: color};
    return (
      <LoadingIndicatorContainer>
        <Spinner style={{width: sizeInPixels}}>
          <SpinnerDot style={{...dotProps, animationDelay: bounceDelay1}} />
          <SpinnerDot style={{...dotProps, animationDelay: bounceDelay2}} />
          <SpinnerDot style={{...dotProps, animationDelay: bounceDelay3}} />
        </Spinner>
      </LoadingIndicatorContainer>
    );
  }
}

const bounceDelay = keyframes`
    0%, 80%, 100% {
      -webkit-transform: scale(0);
      transform: scale(0);
    } 40% {
      -webkit-transform: scale(1.0);
      transform: scale(1.0);
    }
`;

const LoadingIndicatorContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Spinner = styled.div`
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const SpinnerDot = styled.div`
  border-radius: 100%;
  display: inline-block;
  animation-name: ${bounceDelay};
  animation-duration: 1.4s;
  animation-iteration-count: infinite;
  animation-timing-function: ease-in-out;
  animation-fill-mode: both;
`;
