import * as React from 'react';
import * as ReactDOM from 'react-dom';

import {App} from '@root/components/app';

function injectApp(): void {
  const root = document.getElementById('root');
  if (root) {
    const app = <App />;
    ReactDOM.render(app, root);
  }
}

function injectAppWhenDOMReady(): void {
  document.addEventListener('DOMContentLoaded', injectApp);
}

function start(): void {
  injectAppWhenDOMReady();
}

start();
