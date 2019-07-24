import {app, session} from 'electron';
import log from 'electron-log';

import {aggregator} from '@root/automate/aggregator';
import {hoursManager} from '@root/automate/hours_manager';
import {stopsManager} from '@root/automate/stops_manager';
import {automateWatcher} from '@root/automate/watcher';
import {handleCommand} from '@root/bridge';
import {gescomDB, SQLITE_DB} from '@root/db';
import {GescomWatcherBobinesFilles} from '@root/gescom/bobines_filles';
import {GescomWatcherBobinesMeres} from '@root/gescom/bobines_meres';
import {GescomWatcherCadencier} from '@root/gescom/cadencier';
import {GescomWatcherCliches} from '@root/gescom/cliches';
import {setupSqliteDB} from '@root/gescom/common';
import {GescomWatcherStocks} from '@root/gescom/stocks';
import {configureLogs} from '@root/log';

import {createBrowserWindow, setupBrowserWindow} from '@shared/electron/browser_window';

configureLogs();
const forceProdMode = false;

async function startServer(): Promise<void> {
  log.info('Setting up sqlite database');
  await setupSqliteDB();
  if (process.env.MODE !== 'development' || forceProdMode) {
    const gescomBobinesFilles = new GescomWatcherBobinesFilles(gescomDB, SQLITE_DB.Gescom);
    const gescomBobinesMeres = new GescomWatcherBobinesMeres(gescomDB, SQLITE_DB.Gescom);
    const gescomCliches = new GescomWatcherCliches(gescomDB, SQLITE_DB.Gescom);
    const gescomStocks = new GescomWatcherStocks(gescomDB, SQLITE_DB.Gescom);
    const gescomCadencier = new GescomWatcherCadencier(gescomDB, SQLITE_DB.Gescom);
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
  if (process.env.MODE !== 'development' || forceProdMode) {
    log.info('Starting Automate aggregator');
    await aggregator.start();
    log.info('Starting Automate watcher');
    automateWatcher.start();
  }
  log.info('Starting Stops manager');
  stopsManager.start();
  log.info('Starting Hours aggregator');
  hoursManager.start();
}

startServer().catch(log.error);

app.on('ready', () => {
  if (session.defaultSession) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({responseHeaders: "default-src 'self'"});
    });
  }
  const browserWindow = createBrowserWindow({
    width: 620,
    height: 477,
  });
  // tslint:disable-next-line: no-any
  setupBrowserWindow(browserWindow, handleCommand).catch((err: any) =>
    log.error('Failure to setup the BrowserWindow', err)
  );
  browserWindow.webContents.openDevTools({mode: 'detach'});
  log.info('Started');
});

app.on('window-all-closed', () => {
  automateWatcher.stop();
  app.quit();
});
