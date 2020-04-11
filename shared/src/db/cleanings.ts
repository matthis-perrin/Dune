import knex from 'knex';

import {CLEANINGS_TABLE_NAME} from '@shared/db/table_names';
import {Cleaning} from '@shared/models';
import {asMap, asNumber, asString} from '@shared/type_utils';

export const CleaningColumns = {
  NAME: 'name',
  LABEL: 'label',
  ORDER: 'order',
  MACHINE: 'machine',
};

export async function createCleaningTable(db: knex): Promise<void> {
  const hasTable = await db.schema.hasTable(CLEANINGS_TABLE_NAME);
  if (!hasTable) {
    await db.schema.createTable(CLEANINGS_TABLE_NAME, table => {
      table.string(CleaningColumns.NAME).primary().notNullable();
      table.text(CleaningColumns.LABEL).notNullable();
      table.text(CleaningColumns.ORDER).notNullable();
      table.text(CleaningColumns.MACHINE);
    });
  }
}

export async function listCleanings(db: knex): Promise<Cleaning[]> {
  return db(CLEANINGS_TABLE_NAME)
    .select()
    .map(cleaningLine => {
      const b = asMap(cleaningLine);
      return {
        name: asString(b[CleaningColumns.NAME], ''),
        label: asString(b[CleaningColumns.LABEL], ''),
        order: asNumber(b[CleaningColumns.ORDER], 0),
        machine: asString(b[CleaningColumns.MACHINE], ''),
      };
    });
}
