import {app, session} from 'electron';
import log from 'electron-log';

import {windowManager} from '@root/window_manager';

import {ClientAppType} from '@shared/models';

app.on('ready', () => {
  if (session.defaultSession) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({responseHeaders: "default-src 'self'"});
    });
    windowManager
      .openWindow({type: ClientAppType.MainApp})
      .then(() => log.info('App Started!'))
      .catch(err => log.error('Error while starting the app', err));
  }
});

app.on('window-all-closed', () => {
  app.quit();
});
