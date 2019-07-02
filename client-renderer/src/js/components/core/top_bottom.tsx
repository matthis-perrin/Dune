import {omit} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {ReactProps} from '@root/components/core/common';

interface TopBottomProps
  extends ReactProps,
    React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  top: JSX.Element | string;
  bottom: JSX.Element | string;
}

export class TopBottom extends React.Component<TopBottomProps> {
  public static displayName = 'TopBottom';

  public render(): JSX.Element {
    const {top, bottom} = this.props;
    const rest = omit(this.props, ['top', 'bottom']);
    return (
      <TopBottomWrapper {...rest}>
        {top}
        {bottom}
      </TopBottomWrapper>
    );
  }
}

const TopBottomWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;
