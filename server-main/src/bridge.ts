import {BrowserWindow} from 'electron';

import {SQLITE_DB} from '@root/db';
import {getErrors} from '@root/state';

import {BridgeCommand, ServerGetStatus, ServerSimulateAutomate} from '@shared/bridge/commands';
import {getStatus} from '@shared/db/gescom_sync';
import {
  getStats as getSpeedStats,
  insertOrUpdateMinutesSpeeds,
  getLastMinute,
} from '@shared/db/speed_minutes';
import {getStats as getStopsStats} from '@shared/db/speed_stops';
import {ServerStatus, ServiceStatus} from '@shared/models';
import {asMap, asNumber} from '@shared/type_utils';
import {aggregator} from '@root/automate/aggregator';

async function getServerStatus(): Promise<ServerStatus> {
  const [gescomData, speedStats, stopsStats] = await Promise.all([
    getStatus(SQLITE_DB.Gescom),
    getSpeedStats(SQLITE_DB.Prod),
    getStopsStats(SQLITE_DB.Prod),
  ]);
  const gescom: {[key: string]: ServiceStatus} = {};
  gescomData.forEach(({name, lastUpdate, rowCount, rowCountSommeil}) => {
    gescom[name] = {lastUpdate, rowCount, rowCountSommeil};
  });

  return {
    automate: {...speedStats, ...stopsStats, lastReceived: aggregator.getLastReceivedSpeed()},
    gescom,
    errors: getErrors(),
    isDev: process.env.MODE === 'development',
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
  if (command === ServerSimulateAutomate) {
    const {speed, minutes} = asMap(data);
    const last = await getLastMinute(SQLITE_DB.Prod);
    const startTs = last ? last.minute : Date.now();
    const minutesSpeeds = new Map<number, number | undefined>();
    const parsedMinutes = asNumber(minutes, 0);
    const parseSpeed = asNumber(speed, undefined);
    for (let i = 0; i < parsedMinutes; i++) {
      minutesSpeeds.set(startTs + i * 60 * 1000, parseSpeed);
    }
    return insertOrUpdateMinutesSpeeds(SQLITE_DB.Prod, minutesSpeeds);
  }
}
