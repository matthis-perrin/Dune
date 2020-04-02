import {omit} from 'lodash-es';
import React from 'react';
import styled from 'styled-components';

import {ReactProps, DivProps} from '@root/components/core/common';
import {SVGIcon} from '@root/components/core/svg_icon';

interface RefLinkProps extends ReactProps, DivProps {
  color?: string;
  noIcon?: boolean;
}

export class RefLink extends React.Component<RefLinkProps> {
  public static displayName = 'RefLink';

  public render(): JSX.Element {
    const {color = 'black', style, children, noIcon} = this.props;

    const rest = omit(this.props, ['color', 'style', 'children']);
    const icon = noIcon ? (
      <React.Fragment />
    ) : (
      <RefLinkIcon name="new-window" width={12} height={12} />
    );

    return (
      <RefLinkWrapper {...rest} style={{...style, color, fill: color}}>
        <RefLinkText>{children}</RefLinkText>
        {icon}
      </RefLinkWrapper>
    );
  }
}

const RefLinkText = styled.div`
  margin-right: 6px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const RefLinkIcon = styled(SVGIcon)`
  display: none;
`;

const RefLinkWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
    svg {
      display: block;
    }
  }
`;
