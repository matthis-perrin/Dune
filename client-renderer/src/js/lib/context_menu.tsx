import {uniqueId} from 'lodash-es';

import {bridge} from '@root/lib/bridge';

import {ContextMenuClicked, ContextMenuClosed} from '@shared/bridge/commands';
import {ContextMenuForBridge} from '@shared/models';
import {asString, asMap} from '@shared/type_utils';

export interface ContextMenu {
  label: string;
  disabled?: boolean;
  callback?(): void;
  submenus?: ContextMenu[];
}

export class ContextMenuManager {
  private readonly contextMenuCallbacks = new Map<string, Map<string, (() => void) | undefined>>();

  public constructor() {
    bridge.addEventListener(ContextMenuClosed, data =>
      this.menuClosed(asString(asMap(data).menuId, ''))
    );
    bridge.addEventListener(ContextMenuClicked, data => {
      const dataMap = asMap(data);
      this.menuItemClicked(asString(dataMap.menuId, ''), asString(dataMap.menuItemId, ''));
    });
  }

  public async open(menus: ContextMenu[]): Promise<void> {
    const menuId = uniqueId('menu-');
    const callbacks = new Map<string, (() => void) | undefined>();
    const menuForBridge = menus.map(menu => this.createMenuAndFillCallbackMap(callbacks, menu));
    this.contextMenuCallbacks.set(menuId, callbacks);
    await bridge.openContextMenu(menuId, menuForBridge);
  }

  private createMenuAndFillCallbackMap(
    callbacks: Map<string, (() => void) | undefined>,
    menu: ContextMenu
  ): ContextMenuForBridge {
    const menuItemId = uniqueId('menu-item-');
    callbacks.set(menuItemId, menu.callback);
    return {
      id: menuItemId,
      label: menu.label,
      disabled: menu.disabled,
      submenus:
        menu.submenus && menu.submenus.map(m => this.createMenuAndFillCallbackMap(callbacks, m)),
    };
  }

  private menuClosed(menuId: string): void {
    this.contextMenuCallbacks.delete(menuId);
  }

  private menuItemClicked(menuId: string, menuItemId: string): void {
    const menuCallbacks = this.contextMenuCallbacks.get(menuId);
    if (!menuCallbacks) {
      return;
    }
    const menuItemCallback = menuCallbacks.get(menuItemId);
    if (!menuItemCallback) {
      return;
    }
    menuItemCallback();
  }
}

export const contextMenuManager = new ContextMenuManager();
