import * as log from 'electron-log';
import fs from 'fs';
import path from 'path';

export function configureLogs(): void {
  const dbPath = path.resolve(process.env.SQLITE_DATABASE_PATH || '.');
  const logFolderPath = path.join(dbPath, '../logs');
  if (!fs.existsSync(logFolderPath)) {
    fs.mkdirSync(logFolderPath);
  }
  log.transports.file.file = path.join(logFolderPath, 'herisson_server_log.log');
}