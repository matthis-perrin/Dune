import {Config} from '@shared/models';
import {BaseStore} from '@shared/store';

export enum AppPage {
  Gestion = 'gestion',
  Administration = 'administration',
}

export interface ModalModel {
  isOpened: boolean;
  content?: JSX.Element;
}

interface AppState {
  currentPage?: AppPage;
  modal: ModalModel;
}

class AppStore extends BaseStore {
  private readonly state: AppState = {
    modal: {
      isOpened: false,
    },
  };

  public getCurrentPage(config: Config): AppPage | undefined {
    if (this.state.currentPage) {
      return this.state.currentPage;
    }
    if (config.hasGestionPage) {
      return AppPage.Gestion;
    }
    if (config.hasGescomPage) {
      return AppPage.Administration;
    }
    return undefined;
  }

  public getState(): AppState {
    return this.state;
  }

  public setCurrentPage(currentPage: AppPage): void {
    this.state.currentPage = currentPage;
    this.emit();
  }

  public openModal(content: JSX.Element): void {
    this.state.modal = {
      isOpened: true,
      content,
    };
    this.emit();
  }

  public closeModal(): void {
    this.state.modal = {
      isOpened: false,
    };
    this.emit();
  }
}

export const appStore = new AppStore();
