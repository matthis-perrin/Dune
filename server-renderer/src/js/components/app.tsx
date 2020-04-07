import React from 'react';
import styled from 'styled-components';

import {GlobalStyle} from '@root/components/global_styles';
import {Herisson} from '@root/components/herisson';
import {MonitoringGescom} from '@root/components/gescom_monitoring';
import {SpeedSimulator} from '@root/components/speed_simulator';
import {bridge} from '@root/lib/bridge';

import {ServerStatus} from '@shared/models';
import {ServerSimulateAutomateMondon, ServerSimulateAutomateGiave} from '@shared/bridge/commands';
import {AutomateMonitoring} from '@root/components/automate_monitoring';

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
        <HerissonWrapper>
          <Herisson
            style={{
              width: '20%',
              height: '20%',
              padding: '0px 0px 16px 0px',
            }}
          />
        </HerissonWrapper>
        <SpeedSimulator
          serverSimulateAutomate={ServerSimulateAutomateMondon}
          displayName={'Mondon'}
        />
        <AutomateMonitoring automate={status.automateMondon} automateName={'MONDON'} />
        <SpeedSimulator
          serverSimulateAutomate={ServerSimulateAutomateGiave}
          displayName={'Giave'}
        />
        <AutomateMonitoring automate={status.automateGiave} automateName={'GIAVE'} />
        {/* AP */}
        <MonitoringGescom gescom={status.gescom} />
        <GlobalStyle />
      </AppWrapper>
    );
  }
}

const AppWrapper = styled.div`
  font-family: Segoe UI, sans-serif;
  padding: 16px;
`;

const HerissonWrapper = styled.div`
  display: flex;
  justify-content: center;
`;
