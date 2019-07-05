import knex from 'knex';

import {SPEED_MINUTES_TABLE_NAME} from '@shared/db/table_names';
import {MinuteSpeed, AutomateStatus} from '@shared/models';
import {asNumber, asMap, asArray} from '@shared/type_utils';

export const SpeedMinutesColumn = {
  Minute: 'minute',
  Speed: 'speed',
};

export async function createSpeedMinutesTable(db: knex): Promise<void> {
  const hasTable = await db.schema.hasTable(SPEED_MINUTES_TABLE_NAME);
  if (!hasTable) {
    await db.schema.createTable(SPEED_MINUTES_TABLE_NAME, table => {
      table
        .integer(SpeedMinutesColumn.Minute)
        .notNullable()
        .primary();
      table.integer(SpeedMinutesColumn.Speed);
    });
  }
}

// tslint:disable-next-line:no-any
function lineAsMinuteSpeed(lineData: any): MinuteSpeed {
  const line = asMap(lineData);
  return {
    minute: asNumber(line[SpeedMinutesColumn.Minute], 0),
    speed: asNumber(line[SpeedMinutesColumn.Speed], undefined),
  };
}

export async function getLastMinute(db: knex): Promise<MinuteSpeed | undefined> {
  const res = await db(SPEED_MINUTES_TABLE_NAME)
    .select([SpeedMinutesColumn.Minute, SpeedMinutesColumn.Speed])
    .orderBy(SpeedMinutesColumn.Minute, 'desc')
    .limit(1);
  if (res.length === 0) {
    return undefined;
  }
  return lineAsMinuteSpeed(res[0]);
}

export async function getFirstMinute(db: knex): Promise<MinuteSpeed | undefined> {
  const res = await db(SPEED_MINUTES_TABLE_NAME)
    .select([SpeedMinutesColumn.Minute, SpeedMinutesColumn.Speed])
    .orderBy(SpeedMinutesColumn.Minute, 'asc')
    .limit(1);
  if (res.length === 0) {
    return undefined;
  }
  return lineAsMinuteSpeed(res[0]);
}

export async function getRowCount(db: knex): Promise<number> {
  return asNumber(
    asMap(
      asArray(await db(SPEED_MINUTES_TABLE_NAME).count(`${SpeedMinutesColumn.Minute} as c`))[0]
    )['c'],
    0
  );
}

export async function getStats(db: knex): Promise<AutomateStatus> {
  const [firstMinute, lastMinute, rowCount] = await Promise.all([
    getFirstMinute(db),
    getLastMinute(db),
    getRowCount(db),
  ]);
  return {firstMinute, lastMinute, rowCount};
}

export async function getMinutesSpeedsSince(db: knex, since: number): Promise<MinuteSpeed[]> {
  return db(SPEED_MINUTES_TABLE_NAME)
    .select([SpeedMinutesColumn.Minute, SpeedMinutesColumn.Speed])
    .where(SpeedMinutesColumn.Minute, '>=', since)
    .map(minuteSpeedLine => {
      const line = asMap(minuteSpeedLine);
      return {
        minute: asNumber(line[SpeedMinutesColumn.Minute], 0),
        speed: asNumber(line[SpeedMinutesColumn.Speed], undefined),
      };
    });
}

export async function insertOrUpdateMinutesSpeeds(
  db: knex,
  minutesSpeeds: Map<number, number | undefined>
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    db.transaction(tx => {
      db(SPEED_MINUTES_TABLE_NAME)
        .transacting(tx)
        .whereIn(SpeedMinutesColumn.Minute, Array.from(minutesSpeeds.keys()))
        .del()
        .then(() => {
          db.batchInsert(
            SPEED_MINUTES_TABLE_NAME,
            Array.from(minutesSpeeds.entries()).map(([minute, speed]) => ({
              [SpeedMinutesColumn.Minute]: minute,
              [SpeedMinutesColumn.Speed]: speed === undefined ? null : speed,
            })),
            100
          )
            .transacting(tx)
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
