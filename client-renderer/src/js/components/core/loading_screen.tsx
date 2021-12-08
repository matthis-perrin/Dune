import * as React from 'react';
import styled from 'styled-components';

import {LoadingIndicator} from '@root/components/core/loading_indicator';

export class LoadingScreen extends React.Component<{}> {
  public static displayName = 'LoadingScreen';

  public render(): JSX.Element {
    return (
      <Container>
        <LoadingIndicator size="large" />
      </Container>
    );
  }
}

const Container = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;
