import knex from 'knex';

import {PROD_HOURS} from '@shared/db/table_names';
import {ProdHours} from '@shared/models';
import {asMap, asString, asNumber} from '@shared/type_utils';

export const ProdHoursColumn = {
  DAY_COLUMN: 'day',
  START_HOUR_COLUMN: 'start_hour',
  START_MINUTE_COLUMN: 'start_minute',
  END_HOUR_COLUMN: 'end_hour',
  END_MINUTE_COLUMN: 'end_minute',
};

export async function createProdHoursTable(db: knex): Promise<void> {
  const hasTable = await db.schema.hasTable(PROD_HOURS);
  if (!hasTable) {
    await db.schema.createTable(PROD_HOURS,table => {
      table.string(ProdHoursColumn.DAY_COLUMN).notNullable().primary();
      table.integer(ProdHoursColumn.START_HOUR_COLUMN).notNullable();
      table.integer(ProdHoursColumn.START_MINUTE_COLUMN).notNullable();
      table.integer(ProdHoursColumn.END_HOUR_COLUMN).notNullable();
      table.integer(ProdHoursColumn.END_MINUTE_COLUMN).notNullable();
    });
  }
}

export async function listProdHours(db: knex): Promise<ProdHours[]> {
  return db(PROD_HOURS)
    .select()
    .map(prodHoursLine => {
      const c = asMap(prodHoursLine);
      return {
        day: asString(c[ProdHoursColumn.DAY_COLUMN], ''),
        startHour: asNumber(c[ProdHoursColumn.START_HOUR_COLUMN], 0),
        startMinute: asNumber(c[ProdHoursColumn.START_MINUTE_COLUMN], 0),
        endHour: asNumber(c[ProdHoursColumn.END_HOUR_COLUMN], 0),
        endMinute: asNumber(c[ProdHoursColumn.END_MINUTE_COLUMN], 0),
      };
    });
}
