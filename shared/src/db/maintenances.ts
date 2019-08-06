import knex from 'knex';

import {MAINTENANCE_TABLE_NAME} from '@shared/db/table_names';
import {Maintenance} from '@shared/models';
import {asMap, asNumber, asString} from '@shared/type_utils';

export const MaintenanceColumns = {
  ID: 'id',
  TITLE: 'title',
  START_TIME: 'start',
  END_TIME: 'end',
};

export async function createMaintenancesTable(db: knex): Promise<void> {
  const hasTable = await db.schema.hasTable(MAINTENANCE_TABLE_NAME);
  if (!hasTable) {
    await db.schema.createTable(MAINTENANCE_TABLE_NAME, table => {
      table
        .integer(MaintenanceColumns.ID)
        .primary()
        .notNullable();
      table.text(MaintenanceColumns.TITLE).notNullable();
      table.integer(MaintenanceColumns.START_TIME).notNullable();
      table.integer(MaintenanceColumns.END_TIME).notNullable();
    });
  }
}

export async function listMaintenances(db: knex): Promise<Maintenance[]> {
  return db(MAINTENANCE_TABLE_NAME)
    .select()
    .map(maintenanceLine => {
      const m = asMap(maintenanceLine);
      return {
        id: asNumber(m[MaintenanceColumns.ID], 0),
        title: asString(m[MaintenanceColumns.TITLE], ''),
        start: asNumber(m[MaintenanceColumns.START_TIME], 0),
        end: asNumber(m[MaintenanceColumns.END_TIME], 0),
      };
    });
}

export async function createMaintenance(
  db: knex,
  start: number,
  end: number,
  title: string
): Promise<void> {
  return db(MAINTENANCE_TABLE_NAME).insert({
    [MaintenanceColumns.TITLE]: title,
    [MaintenanceColumns.START_TIME]: start,
    [MaintenanceColumns.END_TIME]: end,
  });
}
