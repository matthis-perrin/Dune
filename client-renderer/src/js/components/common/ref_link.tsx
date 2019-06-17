import {omit} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {ReactProps, DivProps} from '@root/components/core/common';
import {SVGIcon} from '@root/components/core/svg_icon';

interface RefLinkProps extends ReactProps, DivProps {
  color?: string;
}

export class RefLink extends React.Component<RefLinkProps> {
  public static displayName = 'RefLink';

  public render(): JSX.Element {
    const {color = 'black', style, children} = this.props;

    const rest = omit(this.props, ['color', 'style', 'children']);

    return (
      <RefLinkWrapper {...rest} style={{...style, color, fill: color}}>
        <RefLinkText>{children}</RefLinkText>
        <RefLinkIcon name="new-window" width={12} height={12} />
      </RefLinkWrapper>
    );
  }
}

const RefLinkText = styled.div`
  margin-right: 6px;
`;

const RefLinkIcon = styled(SVGIcon)`
  display: none;
`;

const RefLinkWrapper = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
    svg {
      display: block;
    }
  }
`;
