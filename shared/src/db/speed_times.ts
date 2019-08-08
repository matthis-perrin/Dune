import knex from 'knex';

import {SPEED_TIMES_TABLE_NAME} from '@shared/db/table_names';
import {SpeedTime, SpeedStatus} from '@shared/models';
import {asNumber, asMap, asArray} from '@shared/type_utils';

export const SpeedTimesColumn = {
  Time: 'time',
  Speed: 'speed',
};

export async function createSpeedTimesTable(db: knex): Promise<void> {
  const hasTable = await db.schema.hasTable(SPEED_TIMES_TABLE_NAME);
  if (!hasTable) {
    await db.schema.createTable(SPEED_TIMES_TABLE_NAME, table => {
      table
        .integer(SpeedTimesColumn.Time)
        .notNullable()
        .primary();
      table.integer(SpeedTimesColumn.Speed);
    });
  }
}

// tslint:disable-next-line:no-any
function lineAsSpeedTime(lineData: any): SpeedTime {
  const line = asMap(lineData);
  return {
    time: asNumber(line[SpeedTimesColumn.Time], 0),
    speed: asNumber(line[SpeedTimesColumn.Speed], undefined),
  };
}

export async function getLastSpeedTime(
  db: knex,
  allowNull: boolean
): Promise<SpeedTime | undefined> {
  let query = db(SPEED_TIMES_TABLE_NAME)
    .select([SpeedTimesColumn.Time, SpeedTimesColumn.Speed])
    .orderBy(SpeedTimesColumn.Time, 'desc')
    .limit(1);
  if (!allowNull) {
    query = query.whereNotNull(SpeedTimesColumn.Speed);
  }
  const res = asArray(await query);
  if (res.length === 0) {
    return undefined;
  }
  return lineAsSpeedTime(res[0]);
}

export async function getFirstSpeedTime(db: knex): Promise<SpeedTime | undefined> {
  const res = asArray(
    await db(SPEED_TIMES_TABLE_NAME)
      .select([SpeedTimesColumn.Time, SpeedTimesColumn.Speed])
      .orderBy(SpeedTimesColumn.Time, 'asc')
      .limit(1)
  );
  if (res.length === 0) {
    return undefined;
  }
  return lineAsSpeedTime(res[0]);
}

export async function getRowCount(db: knex): Promise<number> {
  return asNumber(
    asMap(asArray(await db(SPEED_TIMES_TABLE_NAME).count(`${SpeedTimesColumn.Time} as c`))[0])['c'],
    0
  );
}

export async function getStats(db: knex): Promise<SpeedStatus> {
  const [firstMinute, lastMinute, rowCount] = await Promise.all([
    getFirstSpeedTime(db),
    getLastSpeedTime(db, true),
    getRowCount(db),
  ]);
  return {firstMinute, lastMinute, rowCount};
}

export async function getSpeedTimesSince(db: knex, since: number): Promise<SpeedTime[]> {
  return db(SPEED_TIMES_TABLE_NAME)
    .select([SpeedTimesColumn.Time, SpeedTimesColumn.Speed])
    .where(SpeedTimesColumn.Time, '>=', since)
    .map(lineAsSpeedTime);
}

export async function getSpeedTimesBetween(
  db: knex,
  start: number,
  end: number
): Promise<SpeedTime[]> {
  return db(SPEED_TIMES_TABLE_NAME)
    .select([SpeedTimesColumn.Time, SpeedTimesColumn.Speed])
    .where(SpeedTimesColumn.Time, '>=', start)
    .andWhere(SpeedTimesColumn.Time, '<', end)
    .map(lineAsSpeedTime);
}

export async function insertOrUpdateSpeedTimes(
  db: knex,
  timeSpeeds: Map<number, number | undefined>
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    db.transaction(tx => {
      db(SPEED_TIMES_TABLE_NAME)
        .transacting(tx)
        .whereIn(SpeedTimesColumn.Time, Array.from(timeSpeeds.keys()))
        .del()
        .then(res => {
          const deleteCount = asNumber(res, 0);
          if (deleteCount > 0) {
            console.warn(
              `Updating ${deleteCount} time_speeds. This should not happend.`,
              timeSpeeds
            );
          }
          db.batchInsert(
            SPEED_TIMES_TABLE_NAME,
            Array.from(timeSpeeds.entries()).map(([time, speed]) => ({
              [SpeedTimesColumn.Time]: time,
              // tslint:disable-next-line:no-null-keyword
              [SpeedTimesColumn.Speed]: speed === undefined ? null : speed,
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

export async function firstSpeedTimeMatchingBetween(
  db: knex,
  start: number, // included
  end: number, // included
  operator: string,
  threshold: number
): Promise<SpeedTime | undefined> {
  return (await db(SPEED_TIMES_TABLE_NAME)
    .select([SpeedTimesColumn.Time, SpeedTimesColumn.Speed])
    .where(SpeedTimesColumn.Time, '>=', start)
    .where(SpeedTimesColumn.Time, '<=', end)
    .whereNotNull(SpeedTimesColumn.Speed)
    .andWhere(SpeedTimesColumn.Speed, operator, threshold)
    .orderBy(SpeedTimesColumn.Time, 'asc')
    .limit(1)
    .map(lineAsSpeedTime))[0];
}

export async function getAverageSpeedBetween(
  db: knex,
  start: number, // included
  end: number // not included
): Promise<number> {
  const res = await db(SPEED_TIMES_TABLE_NAME)
    .avg(`${SpeedTimesColumn.Speed} as average_speed`)
    .where(SpeedTimesColumn.Time, '>=', start)
    .where(SpeedTimesColumn.Time, '<', end)
    .whereNotNull(SpeedTimesColumn.Speed);
  return asNumber(asMap(asArray(res)[0])['average_speed'], 0);
}
