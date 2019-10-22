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

async function sendEmailAsync(
  user: string,
  password: string,
  dest: string,
  subject: string,
  attachments: {filename: string; content: Buffer}[]
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    log.info(`Sending email to ${dest}`);
    sendEmail({
      auth: {
        user,
        pass: password,
      },
      from: user,
      to: dest,
      subject,
      attachments,
      onError: err => {
        log.error(err);
        reject(err);
      },
      onSuccess: data => {
        log.info(`Success sending to ${dest}`, data);
        resolve();
      },
    });
  });
}

async function postStart(): Promise<void> {
  log.info('Starting with params', process.argv.slice(1));
  const action = getArg('-action');
  const archive = getArg('-archive');
  const user = getArg('-user');
  const password = getArg('-password');
  const dest = getArg('-dest');
  if (
    action === 'report' &&
    archive !== undefined &&
    user !== undefined &&
    password !== undefined &&
    dest !== undefined
  ) {
    log.info('Mode report. Creating the report window');
    const reportWindow = await windowManager.openWindow({type: ClientAppType.ReportsPrinterApp});
    log.info('Created. Waiting a bit...');
    setTimeout(() => {
      const archiveDir = path.resolve(archive);
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${padNumber(today.getMonth(), 2)}-${padNumber(
        today.getDate(),
        2
      )}`;
      const filename = `Rapport ${todayStr}.pdf`;
      let filePath = path.join(archiveDir, filename);
      log.info(`Will save the report to ${filePath}`);
      if (fs.existsSync(filePath)) {
        filePath = path.join(
          archiveDir,
          `Rapport ${todayStr} ${padNumber(Math.floor(Math.random() * 1000), 4)}.pdf`
        );
        log.info(`File already exists. Will save to ${filePath}`);
      }
      windowManager
        .saveAsPDF(reportWindow, filePath, true)
        .then(data => {
          const emails = dest.split(',');
          const subject = `Rapport de production du ${today.toLocaleDateString('fr', {
            month: 'long',
            day: '2-digit',
            year: 'numeric',
          })}`;
          const attachments = [
            {
              filename: `Rapport ${todayStr}.pdf`,
              content: data,
            },
          ];
          Promise.all(
            emails.map(email => sendEmailAsync(user, password, email, subject, attachments))
          )
            .then(() => {
              windowManager.closeWindow(reportWindow.id);
              process.exit();
            })
            .catch(() => {
              windowManager.closeWindow(reportWindow.id);
              process.exit();
            });
        })
        .catch(err => {
          log.error(err);
          windowManager.closeWindow(reportWindow.id);
          process.exit();
        });
    }, 10000);

    return;
  } else {
    await windowManager.openWindow({type: ClientAppType.MainApp});
  }
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
