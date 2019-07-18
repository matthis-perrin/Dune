import knex from 'knex';

import {SPEED_STOPS_TABLE_NAME} from '@shared/db/table_names';
import {Stop, StopStatus} from '@shared/models';
import {asNumber, asMap, asArray} from '@shared/type_utils';

export const SpeedStopsColumn = {
  Start: 'start',
  End: 'end',
};

export async function createSpeedStopsTable(db: knex): Promise<void> {
  const hasTable = await db.schema.hasTable(SPEED_STOPS_TABLE_NAME);
  if (!hasTable) {
    await db.schema.createTable(SPEED_STOPS_TABLE_NAME, table => {
      table
        .integer(SpeedStopsColumn.Start)
        .notNullable()
        .primary();
      table.integer(SpeedStopsColumn.End);
    });
  }
}

// tslint:disable-next-line:no-any
function lineAsStop(lineData: any): Stop {
  const line = asMap(lineData);
  return {
    start: asNumber(line[SpeedStopsColumn.Start], 0),
    end: asNumber(line[SpeedStopsColumn.End], undefined),
  };
}

export async function getLastStop(db: knex): Promise<Stop | undefined> {
  const res = await db(SPEED_STOPS_TABLE_NAME)
    .select([SpeedStopsColumn.Start, SpeedStopsColumn.End])
    .orderBy(SpeedStopsColumn.Start, 'desc')
    .limit(1);
  if (res.length === 0) {
    return undefined;
  }
  return lineAsStop(res[0]);
}

export async function getRowCount(db: knex): Promise<number> {
  return asNumber(
    asMap(asArray(await db(SPEED_STOPS_TABLE_NAME).count(`${SpeedStopsColumn.Start} as c`))[0])[
      'c'
    ],
    0
  );
}

export async function getStats(db: knex): Promise<StopStatus> {
  const lastStop = await getLastStop(db);
  return {lastStop};
}

export async function insertOrUpdateStop(db: knex, start: number, end?: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    db.transaction(tx => {
      db(SPEED_STOPS_TABLE_NAME)
        .transacting(tx)
        .where(SpeedStopsColumn.Start, '=', start)
        .del()
        .then(() => {
          db(SPEED_STOPS_TABLE_NAME)
            .transacting(tx)
            .insert({
              [SpeedStopsColumn.Start]: start,
              [SpeedStopsColumn.End]: end,
            })
            .then(() => {
              tx.commit();
              resolve();
            })
            .catch(err => {
              tx.rollback();
              reject(err);
            });
        })
        .catch(err => {
          tx.rollback();
          reject(err);
        });
    });
  });
}
