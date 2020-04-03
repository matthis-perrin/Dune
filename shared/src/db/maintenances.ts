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
      table.integer(MaintenanceColumns.ID).primary().notNullable();
      table.text(MaintenanceColumns.TITLE).notNullable();
      table.integer(MaintenanceColumns.START_TIME).notNullable();
      table.integer(MaintenanceColumns.END_TIME).notNullable();
    });
  }
}

// tslint:disable-next-line:no-any
function mapLineToMaintenance(data: any): Maintenance {
  const m = asMap(data);
  return {
    id: asNumber(m[MaintenanceColumns.ID], 0),
    title: asString(m[MaintenanceColumns.TITLE], ''),
    start: asNumber(m[MaintenanceColumns.START_TIME], 0),
    end: asNumber(m[MaintenanceColumns.END_TIME], 0),
  };
}

export async function getMaintenancesBetween(
  db: knex,
  start: number,
  end: number
): Promise<Maintenance[]> {
  return db(MAINTENANCE_TABLE_NAME)
    .select()
    .where(MaintenanceColumns.START_TIME, '>=', start)
    .andWhere(MaintenanceColumns.START_TIME, '<', end)
    .orWhere(function (): void {
      // tslint:disable-next-line:no-invalid-this
      this.where(MaintenanceColumns.END_TIME, '>=', start).andWhere(
        MaintenanceColumns.END_TIME,
        '<',
        end
      );
    })
    .map(mapLineToMaintenance);
}

export async function createMaintenance(
  db: knex,
  start: number,
  end: number,
  title: string
): Promise<void> {
  return db(MAINTENANCE_TABLE_NAME).insert({
    // tslint:disable-next-line: no-magic-numbers
    [MaintenanceColumns.ID]: Math.round(Math.random() * 1e9),
    [MaintenanceColumns.TITLE]: title,
    [MaintenanceColumns.START_TIME]: start,
    [MaintenanceColumns.END_TIME]: end,
  });
}

export async function deleteMaintenance(db: knex, id: number): Promise<void> {
  return db(MAINTENANCE_TABLE_NAME).where(MaintenanceColumns.ID, '=', id).del();
}
