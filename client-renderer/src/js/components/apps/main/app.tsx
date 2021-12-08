import * as React from 'react';

import {AdministrationPage} from '@root/components/apps/main/administration/page';
import {GestionPage} from '@root/components/apps/main/gestion/page';
import {MainGlobalStyle} from '@root/components/apps/main/main_global_styles';
import {Sidebar} from '@root/components/apps/main/sidebar/index';
import {AppPage, appStore} from '@root/stores/app_store';

import {Config} from '@shared/models';

interface Props {
  config: Config;
}

interface State {
  currentPage?: AppPage;
}

export class MainApp extends React.Component<Props, State> {
  public static displayName = 'MainApp';

  public constructor(props: Props) {
    super(props);
    this.state = this.getAppState();
  }

  public componentDidMount(): void {
    appStore.addListener(this.handleAppChange);
  }

  public componentWillUnmount(): void {
    appStore.removeListener(this.handleAppChange);
  }

  private readonly handleAppChange = (): void => {
    this.setState(this.getAppState());
  };

  private getAppState(): State {
    return {
      currentPage: appStore.getCurrentPage(this.props.config),
    };
  }

  private renderPage(page: JSX.Element, pageName: AppPage): JSX.Element {
    const {currentPage} = this.state;
    return <div style={{display: pageName === currentPage ? 'block' : 'none'}}>{page}</div>;
  }

  public render(): JSX.Element {
    const {config} = this.props;
    return (
      <React.Fragment>
        <MainGlobalStyle />
        <Sidebar config={config} />
        {config.hasGestionPage && this.renderPage(<GestionPage config={config} />, AppPage.Gestion)}
        {config.hasGescomPage && this.renderPage(<AdministrationPage />, AppPage.Administration)}
      </React.Fragment>
    );
  }
}
