import {BrowserWindow} from 'electron';

import {SQLITE_DB} from '@root/db';
import {getErrors} from '@root/state';

import {BridgeCommand, ServerGetStatus} from '@shared/bridge/commands';
import {getStatus} from '@shared/db/gescom_sync';
import {getStats} from '@shared/db/speed_minutes';
import {ServerStatus, ServiceStatus} from '@shared/models';

async function getServerStatus(): Promise<ServerStatus> {
  const [gescomData, automate] = await Promise.all([
    getStatus(SQLITE_DB.Gescom),
    getStats(SQLITE_DB.Automate),
  ]);
  const gescom: {[key: string]: ServiceStatus} = {};
  gescomData.forEach(({name, lastUpdate, rowCount, rowCountSommeil}) => {
    gescom[name] = {lastUpdate, rowCount, rowCountSommeil};
  });

  return {
    automate,
    gescom,
    errors: getErrors(),
  };
}

export async function handleCommand(
  browserWindow: BrowserWindow,
  command: BridgeCommand,
  // tslint:disable-next-line:no-any
  data: any
  // tslint:disable-next-line:no-any
): Promise<any> {
  if (command === ServerGetStatus) {
    return getServerStatus();
  }
}
