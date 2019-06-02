import * as React from 'react';
import styled from 'styled-components';

import {ListBobinesFillesApp} from '@root/components/apps/list_bobines_filles/app';
import {ListBobinesMeresApp} from '@root/components/apps/list_bobines_meres/app';
import {ListClichesApp} from '@root/components/apps/list_cliches/app';
import {ListOperationsApp} from '@root/components/apps/list_operations/app';
import {ListPerfosApp} from '@root/components/apps/list_perfos/app';
import {ListRefentesApp} from '@root/components/apps/list_refentes/app';
import {MainApp} from '@root/components/apps/main/app';
import {ViewOperationApp} from '@root/components/apps/view_operation/app';
import {GlobalStyle} from '@root/components/global_styles';
import {Modal} from '@root/components/modal';
import {bridge} from '@root/lib/bridge';

import {ClientAppInfo, ClientAppType} from '@shared/models';
import {asMap, asNumber} from '@shared/type_utils';

interface Props {
  windowId: string;
}

interface State {
  appInfo?: ClientAppInfo;
  error?: string;
}

export class AppManager extends React.Component<Props, State> {
  public static displayName = 'AppManager';

  public constructor(props: Props) {
    super(props);
    this.state = {};
  }

  public componentDidMount(): void {
    bridge
      .getAppInfo(this.props.windowId)
      .then(appInfo => this.setState({appInfo}))
      .catch(err => this.setState({error: err as string}));
  }

  private renderApp(appInfo: ClientAppInfo): JSX.Element {
    const {data, type} = appInfo;

    if (type === ClientAppType.MainApp) {
      return <MainApp />;
    }
    if (type === ClientAppType.ListBobinesFillesApp) {
      return <ListBobinesFillesApp />;
    }
    if (type === ClientAppType.ListBobinesMeresApp) {
      return <ListBobinesMeresApp />;
    }
    if (type === ClientAppType.ListClichesApp) {
      return <ListClichesApp />;
    }
    if (type === ClientAppType.ListPerfosApp) {
      return <ListPerfosApp />;
    }
    if (type === ClientAppType.ListRefentesApp) {
      return <ListRefentesApp />;
    }
    if (type === ClientAppType.ListOperationsApp) {
      return <ListOperationsApp />;
    }

    if (type === ClientAppType.ViewOperationApp) {
      const {operationId} = asMap(data);
      return <ViewOperationApp operationId={asNumber(operationId, undefined)} />;
    }
    return (
      <TempWrapper>
        <div>Unknown App:</div>
        <pre>{JSON.stringify(appInfo, undefined, 2)}</pre>
      </TempWrapper>
    );
  }

  public renderContent(): JSX.Element {
    const {appInfo, error} = this.state;

    if (error) {
      return (
        <TempWrapper>
          <pre>{error}</pre>
        </TempWrapper>
      );
    }

    if (appInfo) {
      return this.renderApp(appInfo);
    }

    return <TempWrapper>Loading...</TempWrapper>;
  }

  public render(): JSX.Element {
    return (
      <React.Fragment>
        <GlobalStyle />
        {this.renderContent()}
        <Modal />
      </React.Fragment>
    );
  }
}

const TempWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
`;
