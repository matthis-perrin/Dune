import {app, session} from 'electron';
import log from 'electron-log';

import {prodHoursStore, constantsStore} from '@root/stores';
import {windowManager} from '@root/window_manager';

import {ClientAppType} from '@shared/models';
import {loadConfig} from './config';

async function startApp(): Promise<void> {
  if (session.defaultSession) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({responseHeaders: "default-src 'self'"});
    });
  }
  await prodHoursStore.start();
  await constantsStore.start();
  await loadConfig();
  await windowManager.openWindow({type: ClientAppType.MainApp});
}

app.on('ready', () => {
  startApp()
    .then(() => log.info('App Started!'))
    .catch(err => {
      log.error('Error while starting the app', err);
      app.quit();
    });
});

app.on('window-all-closed', () => {
  app.quit();
});
