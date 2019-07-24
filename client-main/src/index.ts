import {app, session} from 'electron';
import log from 'electron-log';

import {prodHoursStore} from '@root/prod_hours_store';
import {windowManager} from '@root/window_manager';

import {ClientAppType} from '@shared/models';

async function startApp(): Promise<void> {
  if (session.defaultSession) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({responseHeaders: "default-src 'self'"});
    });
  }
  await prodHoursStore.start();
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
