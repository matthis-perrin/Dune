import * as React from 'react';
import styled from 'styled-components';

import {Stop, StopType} from '@shared/models';

interface StopDetailsProps {
  stop: Stop;
  type?: StopType;
  planProdId?: string;
  maintenanceId?: string;
  // ...
}

export class StopDetails extends React.Component<StopDetailsProps> {
  public static displayName = 'StopDetails';

  public renderEmpty(): JSX.Element {
    return <EmptyDetails>non renseigné</EmptyDetails>;
  }

  public render(): JSX.Element {
    return <Wrapper>{this.renderEmpty()}</Wrapper>;
  }
}

const Wrapper = styled.div`
  width: 100%;
  min-height: 128px;
  box-sizing: border-box;
  padding: 16px;
`;

const EmptyDetails = styled.div`
  width: 100%;
  height: 128px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-style: italic;
`;
