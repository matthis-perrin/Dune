import {BrowserWindow} from 'electron';

import {SQLITE_DB} from '@root/db';
import {getErrors} from '@root/state';

import {BridgeCommand, ServerGetStatus} from '@shared/bridge/commands';
import {getStatus} from '@shared/db/gescom_sync';
import {getStats as getSpeedStats} from '@shared/db/speed_minutes';
import {getStats as getStopsStats} from '@shared/db/speed_stops';
import {ServerStatus, ServiceStatus} from '@shared/models';

async function getServerStatus(): Promise<ServerStatus> {
  const [gescomData, speedStats, stopsStats] = await Promise.all([
    getStatus(SQLITE_DB.Gescom),
    getSpeedStats(SQLITE_DB.Automate),
    getStopsStats(SQLITE_DB.Automate),
  ]);
  const gescom: {[key: string]: ServiceStatus} = {};
  gescomData.forEach(({name, lastUpdate, rowCount, rowCountSommeil}) => {
    gescom[name] = {lastUpdate, rowCount, rowCountSommeil};
  });

  return {
    automate: {...speedStats, ...stopsStats},
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
