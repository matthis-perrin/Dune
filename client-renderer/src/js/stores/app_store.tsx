import {BaseStore} from '@root/stores/store';

export enum AppPage {
  Gestion = 'gestion',
  Production = 'production',
  Administration = 'administration',
}

export interface ModalModel {
  isOpened: boolean;
  content?: JSX.Element;
}

interface AppState {
  currentPage: AppPage;
  modal: ModalModel;
}

class AppStore extends BaseStore {
  private readonly state: AppState = {
    currentPage: AppPage.Administration,
    modal: {
      isOpened: false,
    },
  };

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
