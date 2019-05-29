import * as React from 'react';
import * as ReactDOM from 'react-dom';

import {AppManager} from '@root/components/apps/app_manager';
import {storeManager} from '@root/stores/store_manager';

function injectApp(app: JSX.Element): void {
  const root = document.getElementById('root');
  if (root) {
    ReactDOM.render(app, root);
  }
}

function injectAppWhenDOMReady(): void {
  document.addEventListener('DOMContentLoaded', () => {
    const id = new URLSearchParams(window.location.search).get('id') || '';
    injectApp(<AppManager windowId={id} />);
  });
}

function start(): void {
  storeManager.start();
  injectAppWhenDOMReady();
}

start();
