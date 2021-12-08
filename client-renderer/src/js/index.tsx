import * as React from 'react';
import * as ReactDOM from 'react-dom';

import {AppManager} from '@root/components/apps/app_manager';
import {getWindowId} from '@root/lib/window_utils';

function injectApp(app: JSX.Element): void {
  const root = document.getElementById('root');
  if (root) {
    ReactDOM.render(app, root);
  }
}

function injectAppWhenDOMReady(): void {
  document.addEventListener('DOMContentLoaded', () => {
    const windowId = getWindowId();
    injectApp(<AppManager windowId={windowId} />);
  });
}

function start(): void {
  injectAppWhenDOMReady();
}

start();
