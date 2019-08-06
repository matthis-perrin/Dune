import knex from 'knex';

import {NON_PROD_TABLE_NAME} from '@shared/db/table_names';
import {NonProd} from '@shared/models';
import {asMap, asNumber, asString} from '@shared/type_utils';

export const NonProdColumns = {
  ID: 'id',
  TITLE: 'title',
  START_TIME: 'start',
  END_TIME: 'end',
};

export async function createNonProdsTable(db: knex): Promise<void> {
  const hasTable = await db.schema.hasTable(NON_PROD_TABLE_NAME);
  if (!hasTable) {
    await db.schema.createTable(NON_PROD_TABLE_NAME, table => {
      table
        .integer(NonProdColumns.ID)
        .primary()
        .notNullable();
      table.text(NonProdColumns.TITLE).notNullable();
      table.integer(NonProdColumns.START_TIME).notNullable();
      table.integer(NonProdColumns.END_TIME).notNullable();
    });
  }
}

export async function listNonProds(db: knex): Promise<NonProd[]> {
  return db(NON_PROD_TABLE_NAME)
    .select()
    .map(maintenanceLine => {
      const m = asMap(maintenanceLine);
      return {
        id: asNumber(m[NonProdColumns.ID], 0),
        title: asString(m[NonProdColumns.TITLE], ''),
        start: asNumber(m[NonProdColumns.START_TIME], 0),
        end: asNumber(m[NonProdColumns.END_TIME], 0),
      };
    });
}

export async function createNonProd(
  db: knex,
  start: number,
  end: number,
  title: string
): Promise<void> {
  return db(NON_PROD_TABLE_NAME).insert({
    [NonProdColumns.TITLE]: title,
    [NonProdColumns.START_TIME]: start,
    [NonProdColumns.END_TIME]: end,
  });
}

export async function deleteNonProd(db: knex, id: number): Promise<void> {
  return db(NON_PROD_TABLE_NAME)
    .where(NonProdColumns.ID, id)
    .del();
}
