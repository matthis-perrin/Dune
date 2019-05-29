import {
  BridgeCommand,
  ServerGetStatus,
  ServerRequestRefresh,
  ServerClearErrors,
} from '@shared/bridge/commands';
import {getErrors} from '@root/state';
import {getStatus} from '@shared/db/gescom_sync';
import {sqliteDB} from '@root/db';
import {ServerStatus, ServiceStatus} from '@shared/models';

async function getServerStatus(): Promise<ServerStatus> {
  const gescomData = await getStatus(sqliteDB);
  const gescom: {[key: string]: ServiceStatus} = {};
  gescomData.forEach(({name, lastUpdate, rowCount, rowCountSommeil}) => {
    gescom[name] = {lastUpdate, rowCount, rowCountSommeil};
  });

  return {
    mondon: {speed: {rowCount: 0, lastUpdate: 0}},
    gescom,
    errors: getErrors(),
  };
}

// tslint:disable-next-line:no-any
export async function handleCommand(command: BridgeCommand, data: any): Promise<any> {
  if (command === ServerGetStatus) {
    return await getServerStatus();
  }
  if (command === ServerRequestRefresh) {
  }
  if (command === ServerClearErrors) {
  }
}
