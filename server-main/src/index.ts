import {app, session} from 'electron';
import log from 'electron-log';

import {handleCommand} from '@root/bridge';
import {gescomDB, sqliteDB} from '@root/db';
import {GescomWatcherBobinesFilles} from '@root/gescom/bobines_filles';
import {GescomWatcherBobinesMeres} from '@root/gescom/bobines_meres';
import {GescomWatcherCadencier} from '@root/gescom/cadencier';
import {GescomWatcherCliches} from '@root/gescom/cliches';
import {setupSqliteDB} from '@root/gescom/common';
import {GescomWatcherStocks} from '@root/gescom/stocks';
import {configureLogs} from '@root/log';

import {createBrowserWindow, setupBrowserWindow} from '@shared/electron/browser_window';

configureLogs();

async function startServer(): Promise<void> {
  log.info('Setting up sqlite database');
  await setupSqliteDB(sqliteDB);
  const gescomBobinesFilles = new GescomWatcherBobinesFilles(gescomDB, sqliteDB);
  const gescomBobinesMeres = new GescomWatcherBobinesMeres(gescomDB, sqliteDB);
  const gescomCliches = new GescomWatcherCliches(gescomDB, sqliteDB);
  const gescomStocks = new GescomWatcherStocks(gescomDB, sqliteDB);
  const gescomCadencier = new GescomWatcherCadencier(gescomDB, sqliteDB);
  log.info('Starting Bobine Filles watcher');
  await gescomBobinesFilles.start();
  log.info('Starting Bobine Meres watcher');
  await gescomBobinesMeres.start();
  log.info('Starting Cliches watcher');
  await gescomCliches.start();
  log.info('Starting Stocks watcher');
  await gescomStocks.start();
  log.info('Starting Cadencier watcher');
  await gescomCadencier.start();
}

startServer();

app.on('ready', () => {
  if (session.defaultSession) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({responseHeaders: "default-src 'self'"});
    });
  }
  const browserWindow = createBrowserWindow({
    width: 900,
    height: 600,
  });
  // tslint:disable-next-line: no-any
  setupBrowserWindow(browserWindow, handleCommand).catch((err: any) =>
    log.error('Failure to setup the BrowserWindow', err)
  );
  browserWindow.webContents.openDevTools({mode: 'detach'});
  log.info('Started');
});

app.on('window-all-closed', () => {
  app.quit();
});
