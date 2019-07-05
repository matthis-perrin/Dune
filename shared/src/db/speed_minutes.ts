import knex from 'knex';

import {SPEED_MINUTES_TABLE_NAME} from '@shared/db/table_names';
import {asNumber} from '@shared/type_utils';

export const SpeedMinutesColumn = {
  Minute: 'minute',
  Speed: 'speed',
};

export async function createSpeedMinutesTable(db: knex): Promise<void> {
  const hasTable = await db.schema.hasTable(SPEED_MINUTES_TABLE_NAME);
  if (!hasTable) {
    await db.schema.createTable(SPEED_MINUTES_TABLE_NAME, table => {
      table
        .number(SpeedMinutesColumn.Minute)
        .notNullable()
        .primary();
      table.number(SpeedMinutesColumn.Speed);
    });
  }
}

export async function setSpeed(db: knex, minute: number, speed?: number): Promise<void> {
  const exists =
    asNumber(
      (await db(SPEED_MINUTES_TABLE_NAME)
        .count('c')
        .where(SpeedMinutesColumn.Minute, '=', minute))['c'],
      0
    ) > 0;
  if (exists) {
    await db(SPEED_MINUTES_TABLE_NAME)
      .where(SpeedMinutesColumn.Minute, '=', minute)
      .update({[SpeedMinutesColumn.Speed]: speed});
  } else {
    await db.insert({[SpeedMinutesColumn.Minute]: minute, [SpeedMinutesColumn.Speed]: speed});
  }
}

export async function getLastMinute(db: knex): Promise<number> {
  const res = await db
    .select(SpeedMinutesColumn.Minute)
    .orderBy(SpeedMinutesColumn.Minute, 'desc')
    .limit(1);
  if (res.length === 0) {
    return 0;
  }
  return asNumber(res[0][SpeedMinutesColumn.Minute], 0);
}
