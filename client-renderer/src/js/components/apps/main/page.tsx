import * as React from 'react';
import styled from 'styled-components';

import {theme} from '@root/theme';

interface Props {
  onClick?(event: React.MouseEvent<HTMLDivElement>): void;
}

export class Page extends React.Component<Props, {}> {
  public static displayName = 'Page';

  public render(): JSX.Element {
    const {children} = this.props;
    return (
      <PageWrapper onClick={this.props.onClick}>
        <PageContent>{children}</PageContent>
      </PageWrapper>
    );
  }
}

const PageWrapper = styled.div`
  position: fixed;
  top: 0;
  left: ${theme.sidebar.width}px;
  bottom: 0;
  right: 0;
  overflow-y: auto;
  padding: ${theme.page.padding}px ${theme.page.padding}px 0 ${theme.page.padding}px;
  background: ${theme.page.backgroundColor};
`;

const PageContent = styled.div``;
