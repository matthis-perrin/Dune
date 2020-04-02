import React from 'react';
import styled from 'styled-components';

import {SVGIcon} from '@root/components/core/svg_icon';
import {appStore, ModalModel} from '@root/stores/app_store';
import {theme} from '@root/theme';

interface Props {}

interface State {
  modal: ModalModel;
}

export class Modal extends React.Component<Props, State> {
  public static displayName = 'Modal';
  // private readonly modalRef = React.createRef<HTMLDivElement>();

  public constructor(props: Props) {
    super(props);
    this.state = this.getModalState();
  }

  public componentDidMount(): void {
    // document.body.addEventListener('click', this.handleBodyClick, false);
    document.addEventListener('keydown', this.handleBodyKeyDown, false);
    appStore.addListener(this.handleAppChange);
  }

  public componentWillUnmount(): void {
    // document.body.removeEventListener('click', this.handleBodyClick);
    document.removeEventListener('keydown', this.handleBodyKeyDown, false);
    appStore.removeListener(this.handleAppChange);
  }

  // private targetIsInModal(target: HTMLElement): boolean {
  //   if (this.modalRef.current === null) {
  //     return false;
  //   }
  //   if (target === this.modalRef.current) {
  //     return true;
  //   }
  //   if (target.parentNode) {
  //     return this.targetIsInModal(target.parentNode as HTMLElement);
  //   }
  //   return false;
  // }

  // private readonly handleBodyClick = (event: MouseEvent) => {
  //   const target = event.target;
  //   if (!target) {
  //     return;
  //   }
  //   if (!this.targetIsInModal(target as HTMLElement)) {
  //     appStore.closeModal();
  //   }
  // };

  private readonly handleBodyKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      appStore.closeModal();
    }
  };

  private readonly handleAppChange = (): void => {
    this.setState(this.getModalState());
  };

  private getModalState(): State {
    return {
      modal: appStore.getState().modal,
    };
  }

  public render(): JSX.Element {
    const {isOpened, content} = this.state.modal;
    const styles: React.CSSProperties = {
      pointerEvents: isOpened ? 'auto' : 'none',
      opacity: isOpened ? 1 : 0,
    };
    return (
      <ModalWrapper style={styles}>
        <ModalCloseButton onClick={() => appStore.closeModal()}>
          <SVGIcon
            name="cross"
            width={theme.modal.closeIconSize}
            height={theme.modal.closeIconSize}
          />
        </ModalCloseButton>
        {content}
      </ModalWrapper>
    );
  }
}

const ModalCloseButton = styled.button`
  background: none;
  border: none;
  box-shadow: none;
  width: ${theme.modal.padding}px;
  height: ${theme.modal.padding}px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0;
  right: 0;
`;

const ModalWrapper = styled.div`
  position: fixed;
  top: ${theme.modal.margin}px;
  right: ${theme.modal.margin}px;
  bottom: ${theme.modal.margin}px;
  left: ${theme.modal.margin}px;
  padding: ${theme.modal.padding}px;
  transition: opacity ease-in-out 300ms;
  background-color: ${theme.modal.backgroundColor};
  border: solid ${theme.modal.borderWidth}px ${theme.modal.borderColor};
  z-index: 1000;
`;
