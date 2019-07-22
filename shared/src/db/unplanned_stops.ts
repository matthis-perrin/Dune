import knex from 'knex';

import {UNPLANNED_STOPS_TABLE_NAME} from '@shared/db/table_names';
import {UnplannedStop} from '@shared/models';
import {asMap, asNumber, asString} from '@shared/type_utils';

export const UnplannedStopColumns = {
  NAME: 'name',
  LABEL: 'label',
  GROUP: 'group',
  ORDER: 'order',
};

export async function createUnplannedStopTable(db: knex): Promise<void> {
  const hasTable = await db.schema.hasTable(UNPLANNED_STOPS_TABLE_NAME);
  if (!hasTable) {
    await db.schema.createTable(UNPLANNED_STOPS_TABLE_NAME, table => {
      table
        .text(UnplannedStopColumns.NAME)
        .primary()
        .notNullable();
      table.text(UnplannedStopColumns.LABEL).notNullable();
      table.text(UnplannedStopColumns.GROUP).notNullable();
      table.text(UnplannedStopColumns.ORDER).notNullable();
    });
  }
}

export async function listUnplannedStop(db: knex): Promise<UnplannedStop[]> {
  return db(UNPLANNED_STOPS_TABLE_NAME)
    .select()
    .map(bobineQuantityLine => {
      const b = asMap(bobineQuantityLine);
      return {
        name: asString(b[UnplannedStopColumns.NAME], ''),
        label: asString(b[UnplannedStopColumns.LABEL], ''),
        group: asString(b[UnplannedStopColumns.GROUP], ''),
        order: asNumber(b[UnplannedStopColumns.ORDER], 0),
      };
    });
}
