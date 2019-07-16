import {BrowserWindow, Menu, MenuItem, MenuItemConstructorOptions} from 'electron';
import {ContextMenuForBridge} from '@shared/models';

export function openContextMenu(
  browserWindow: BrowserWindow,
  menuItemsData: ContextMenuForBridge[],
  onCloseCallback: () => void,
  onMenuItemClicked: (id: string) => void
): void {
  const menu = new Menu();
  menuItemsData.forEach(menuItemData =>
    menu.append(new MenuItem(getMenuItemOptions(menuItemData, onMenuItemClicked)))
  );
  menu.popup({window: browserWindow, callback: onCloseCallback});
}

function getMenuItemOptions(
  menuItem: ContextMenuForBridge,
  onMenuItemClicked: (id: string) => void
): MenuItemConstructorOptions {
  return {
    label: menuItem.label,
    enabled: menuItem.disabled,
    click: () => onMenuItemClicked(menuItem.id),
    submenu:
      menuItem.submenus &&
      menuItem.submenus.map(submenu => getMenuItemOptions(submenu, onMenuItemClicked)),
  };
}
