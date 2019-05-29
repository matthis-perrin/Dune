import * as React from 'react';
import styled from 'styled-components';

import {Errors} from '@root/components/errors';
import {GlobalStyle} from '@root/components/global_styles';
import {Monitoring} from '@root/components/monitoring';
import {bridge} from '@root/lib/bridge';

import {ServerStatus} from '@shared/models';

const REFRESH_PERIOD_MS = 500;

interface Props {}

interface State {
  status?: ServerStatus;
}

export class App extends React.Component<Props, State> {
  public static displayName = 'App';

  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  public componentDidMount(): void {
    this.refreshStatus();
  }

  private readonly refreshStatus = () => {
    bridge
      .getServerStatus()
      .then(status => {
        this.setState({status});
        setTimeout(this.refreshStatus, REFRESH_PERIOD_MS);
      })
      .catch(error => {
        console.error(error);
        setTimeout(this.refreshStatus, REFRESH_PERIOD_MS);
      });
  };

  public render(): JSX.Element {
    const {status} = this.state;
    if (!status) {
      return <div>Loading...</div>;
    }
    return (
      <AppWrapper>
        <MonitoringWrapper>
          <Monitoring mondon={status.mondon} gescom={status.gescom} />
        </MonitoringWrapper>
        <ErrorsWrapper>
          <Errors errors={status.errors} />
        </ErrorsWrapper>
        <GlobalStyle />
      </AppWrapper>
    );
  }
}

const padding = 16;

const AppWrapper = styled.div`
  font-family: Segoe UI, sans-serif;
`;

const MonitoringWrapper = styled.div`
  position: fixed;
  top: ${padding}px;
  right: calc(50% + ${padding / 2}px);
  bottom: ${padding}px;
  left: ${padding}px;
  overflow: auto;
`;

const ErrorsWrapper = styled.div`
  position: fixed;
  top: ${padding}px;
  right: ${padding}px;
  bottom: ${padding}px;
  left: calc(50% + ${padding / 2}px);
  overflow: auto;
`;
