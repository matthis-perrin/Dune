import knex from 'knex';

import {SPEED_HOURS_TABLE_NAME} from '@shared/db/table_names';
import {HourStats} from '@shared/models';
import {asNumber, asMap} from '@shared/type_utils';

export const SpeedHoursColumn = {
  Hour: 'hour',
  AvgSpeed: 'avg_speed',
  MedianSpeed: 'median_speed',
  FirstSpeed: 'first_speed',
  LastSpeed: 'last_speed',
  MinSpeed: 'min_speed',
  MaxSpeed: 'max_speed',
  SpeedCount: 'speed_count',
  NullCount: 'null_count',
};

export async function createSpeedHoursTable(db: knex): Promise<void> {
  const hasTable = await db.schema.hasTable(SPEED_HOURS_TABLE_NAME);
  if (!hasTable) {
    await db.schema.createTable(SPEED_HOURS_TABLE_NAME, table => {
      table
        .integer(SpeedHoursColumn.Hour)
        .notNullable()
        .primary();
      table.integer(SpeedHoursColumn.AvgSpeed);
      table.integer(SpeedHoursColumn.MedianSpeed);
      table.integer(SpeedHoursColumn.FirstSpeed);
      table.integer(SpeedHoursColumn.LastSpeed);
      table.integer(SpeedHoursColumn.MinSpeed);
      table.integer(SpeedHoursColumn.MaxSpeed);
      table.integer(SpeedHoursColumn.SpeedCount).notNullable();
      table.integer(SpeedHoursColumn.NullCount).notNullable();
    });
  }
}

// tslint:disable-next-line:no-any
function lineAsHourStats(lineData: any): HourStats {
  const line = asMap(lineData);
  return {
    hour: asNumber(line[SpeedHoursColumn.Hour], 0),
    avgSpeed: asNumber(line[SpeedHoursColumn.AvgSpeed], undefined),
    medianSpeed: asNumber(line[SpeedHoursColumn.MedianSpeed], undefined),
    firstSpeed: asNumber(line[SpeedHoursColumn.FirstSpeed], undefined),
    lastSpeed: asNumber(line[SpeedHoursColumn.LastSpeed], undefined),
    minSpeed: asNumber(line[SpeedHoursColumn.MinSpeed], undefined),
    maxSpeed: asNumber(line[SpeedHoursColumn.MaxSpeed], undefined),
    speedCount: asNumber(line[SpeedHoursColumn.SpeedCount], 0),
    nullCount: asNumber(line[SpeedHoursColumn.NullCount], 0),
  };
}

export async function getLastHour(db: knex): Promise<HourStats | undefined> {
  const res = await db(SPEED_HOURS_TABLE_NAME)
    .select()
    .orderBy(SpeedHoursColumn.Hour, 'desc')
    .limit(1);
  if (res.length === 0) {
    return undefined;
  }
  return lineAsHourStats(res[0]);
}

export async function insertHourStats(db: knex, hourStats: HourStats): Promise<void> {
  return db(SPEED_HOURS_TABLE_NAME).insert({
    [SpeedHoursColumn.Hour]: hourStats.hour,
    [SpeedHoursColumn.AvgSpeed]: hourStats.avgSpeed,
    [SpeedHoursColumn.MedianSpeed]: hourStats.medianSpeed,
    [SpeedHoursColumn.FirstSpeed]: hourStats.firstSpeed,
    [SpeedHoursColumn.LastSpeed]: hourStats.lastSpeed,
    [SpeedHoursColumn.MinSpeed]: hourStats.minSpeed,
    [SpeedHoursColumn.MaxSpeed]: hourStats.maxSpeed,
    [SpeedHoursColumn.SpeedCount]: hourStats.speedCount,
    [SpeedHoursColumn.NullCount]: hourStats.nullCount,
  });
}
