import * as React from 'react';
import styled from 'styled-components';

import {GlobalStyle} from '@root/components/global_styles';
import {Herisson} from '@root/components/herisson';
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
        <Monitoring automate={status.automate} gescom={status.gescom} />
        <Herisson
          style={{
            width: 100,
            position: 'fixed',
            top: 0,
            right: 0,
            borderRadius: 55,
            background: 'white',
            padding: ' 0 5px 10px 5px',
            boxShadow: '0px 0px 33px 8px rgba(255,255,255,1)',
          }}
        />
        <GlobalStyle />
      </AppWrapper>
    );
  }
}

const AppWrapper = styled.div`
  font-family: Segoe UI, sans-serif;
  padding: 16px;
`;
