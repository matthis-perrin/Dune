import {BrowserWindow} from 'electron';

import {aggregator, AGGREGATION_SIZE_MS} from '@root/automate/aggregator';
import {SQLITE_DB} from '@root/db';
import {getErrors} from '@root/state';

import {BridgeCommand, ServerGetStatus, ServerSimulateAutomate} from '@shared/bridge/commands';
import {getStatus} from '@shared/db/gescom_sync';
import {getStats as getStopsStats} from '@shared/db/speed_stops';
import {
  getStats as getSpeedStats,
  insertOrUpdateSpeedTimes,
  getLastSpeedTime,
} from '@shared/db/speed_times';
import {ServerStatus, ServiceStatus} from '@shared/models';
import {asMap, asNumber} from '@shared/type_utils';
import {AllPromise} from '@shared/promise_utils';

async function getServerStatus(): Promise<ServerStatus> {
  const [gescomData, speedStats, stopsStats] = await AllPromise([
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

const MS_IN_MINUTE = 60000;

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
    const last = await getLastSpeedTime(SQLITE_DB.Prod, true);
    const startTs = last
      ? last.time + AGGREGATION_SIZE_MS
      : Date.now() % aggregator.getCurrentTime();
    const timeSpeeds = new Map<number, number | undefined>();
    const parsedMinutes = asNumber(minutes, 0);
    const valueToInsert = Math.round(
      minutes === 0 ? 1 : parsedMinutes * (MS_IN_MINUTE / AGGREGATION_SIZE_MS)
    );
    const parseSpeed = asNumber(speed, undefined);
    for (let i = 0; i < valueToInsert; i++) {
      timeSpeeds.set(startTs + i * AGGREGATION_SIZE_MS, parseSpeed);
    }
    return insertOrUpdateSpeedTimes(SQLITE_DB.Prod, timeSpeeds);
  }
}
