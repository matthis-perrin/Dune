import {app, session} from 'electron';
import log from 'electron-log';
import fs from 'fs';
import {sendEmail} from 'nodejs-nodemailer-outlook';
import path from 'path';

import {loadConfig} from '@root/config';
import {prodHoursStore, constantsStore} from '@root/stores';
import {windowManager} from '@root/window_manager';

import {padNumber} from '@shared/lib/utils';
import {ClientAppType} from '@shared/models';

async function startApp(): Promise<void> {
  if (session.defaultSession) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({responseHeaders: "default-src 'self'"});
    });
  }
  await prodHoursStore.start();
  await constantsStore.start();
  await loadConfig();
  await postStart();
}

function getArg(name: string): string | undefined {
  const args = process.argv.slice(1);
  const matchingArgs = args.filter(arg => arg.startsWith(`${name}=`))[0];
  if (matchingArgs === undefined) {
    return undefined;
  }
  return matchingArgs.slice(name.length + 1);
}

async function postStart(): Promise<void> {
  const action = getArg('action');
  const archive = getArg('archive');
  const user = getArg('user');
  const password = getArg('password');
  const dest = getArg('dest');
  if (
    action === 'report' &&
    archive !== undefined &&
    user !== undefined &&
    password !== undefined &&
    dest !== undefined
  ) {
    const reportWindow = await windowManager.openWindow({type: ClientAppType.ReportsPrinterApp});
    setTimeout(() => {
      const archiveDir = path.resolve(archive);
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${padNumber(today.getMonth(), 2)}-${padNumber(
        today.getDate(),
        2
      )}`;
      const filename = `Rapport ${todayStr}.pdf`;
      let filePath = path.join(archiveDir, filename);
      if (fs.existsSync(filePath)) {
        filePath = path.join(
          archiveDir,
          `Rapport ${todayStr} ${padNumber(Math.floor(Math.random() * 1000), 4)}.pdf`
        );
      }
      log.info(`Saving report to ${filePath}`);
      windowManager
        .saveAsPDF(reportWindow, filePath, true)
        .then(data => {
          log.info(`Sending email to ${dest}`);
          sendEmail({
            auth: {
              user,
              pass: password,
            },
            from: user,
            to: dest,
            subject: `Rapport de production du ${today.toLocaleDateString('fr', {
              month: 'long',
              day: '2-digit',
              year: 'numeric',
            })}`,
            attachments: [
              {
                filename: `Rapport ${todayStr}.pdf`,
                content: data,
              },
            ],
            onError: err => {
              log.error(err);
              windowManager.closeWindow(reportWindow.id);
              process.exit();
            },
            onSuccess: i => {
              log.info('Success, closing window and exiting', i);
              windowManager.closeWindow(reportWindow.id);
              process.exit();
            },
          });
        })
        .catch(err => {
          log.error(err);
          windowManager.closeWindow(reportWindow.id);
          process.exit();
        });
    }, 2000);

    return;
  }

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
