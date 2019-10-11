import knex from 'knex';

import {GESCOM_SYNC_TABLE_NAME} from '@shared/db/table_names';
import {asDate, asArray, asMap, asString, asNumber} from '@shared/type_utils';

const TABLE_NAME_COLUMN = 'table_name';
const LAST_UPDATED_COLUMN = 'last_updated';
const LAST_CHECKED_COLUMN = 'last_checked';

export interface GescomSyncData {
  lastUpdated: Date;
  lastChecked: Date;
}

export async function createGescomSyncTable(db: knex, truncateGescom: boolean): Promise<void> {
  const hasTable = await db.schema.hasTable(GESCOM_SYNC_TABLE_NAME);
  if (!hasTable) {
    await db.schema.createTable(GESCOM_SYNC_TABLE_NAME, table => {
      table
        .string(TABLE_NAME_COLUMN)
        .notNullable()
        .primary();
      table.dateTime(LAST_UPDATED_COLUMN).notNullable();
      table.dateTime(LAST_CHECKED_COLUMN).notNullable();
    });
  }
  if (truncateGescom) {
    await db(GESCOM_SYNC_TABLE_NAME).truncate();
  }
}

export async function getStatus(
  db: knex
): Promise<{name: string; rowCount: number; rowCountSommeil?: number; lastUpdate: number}[]> {
  const data = asArray(await db(GESCOM_SYNC_TABLE_NAME).select());
  const promises = data.map(d => getTableRowCount(db, asString(asMap(d)[TABLE_NAME_COLUMN], '')));
  const rest = data.map(d => ({
    lastUpdate: asNumber(asMap(d)[LAST_CHECKED_COLUMN], 0),
    name: asString(asMap(d)[TABLE_NAME_COLUMN], ''),
  }));
  const rowCounts = await Promise.all(promises);
  return rest.map((r, i) => ({
    ...r,
    rowCount: rowCounts[i].rowCount,
    rowCountSommeil: rowCounts[i].rowCountSommeil,
  }));
}

export async function getTableRowCount(
  db: knex,
  tableName: string
): Promise<{rowCount: number; rowCountSommeil?: number}> {
  const tablesWithSommeil = ['bobines_filles', 'bobines_meres', 'cliches'];
  let rowCountSommeil: number | undefined;
  if (tablesWithSommeil.indexOf(tableName) !== -1) {
    rowCountSommeil = asNumber(
      asMap(
        asArray(
          await db(tableName)
            .where('sommeil', '=', '1')
            .count()
        )[0]
      )['count(*)'],
      undefined
    );
  }
  const rowCount = asNumber(asMap(asArray(await db(tableName).count())[0])['count(*)'], 0);
  return {rowCount, rowCountSommeil};
}

export async function getGescomSyncData(db: knex, tableName: string): Promise<GescomSyncData> {
  const syncInfo = asArray(
    await db(GESCOM_SYNC_TABLE_NAME)
      .select([LAST_UPDATED_COLUMN, LAST_CHECKED_COLUMN])
      .where(TABLE_NAME_COLUMN, '=', tableName)
  );
  if (syncInfo.length === 0) {
    return {
      lastUpdated: new Date(0),
      lastChecked: new Date(0),
    };
  }
  return {
    lastUpdated: asDate(asMap(syncInfo[0])[LAST_UPDATED_COLUMN]),
    lastChecked: asDate(asMap(syncInfo[0])[LAST_CHECKED_COLUMN]),
  };
}

export async function updateGescomSyncData(
  db: knex,
  tableName: string,
  lastUpdated: Date,
  lastChecked: Date
): Promise<void> {
  const lines = asArray(
    await db(GESCOM_SYNC_TABLE_NAME)
      .select(TABLE_NAME_COLUMN)
      .where(TABLE_NAME_COLUMN, '=', tableName)
  );
  if (lines.length > 0) {
    await db(GESCOM_SYNC_TABLE_NAME)
      .update({
        [LAST_UPDATED_COLUMN]: lastUpdated,
        [LAST_CHECKED_COLUMN]: lastChecked,
      })
      .where(TABLE_NAME_COLUMN, '=', tableName);
  } else {
    await db(GESCOM_SYNC_TABLE_NAME).insert({
      [TABLE_NAME_COLUMN]: tableName,
      [LAST_UPDATED_COLUMN]: lastUpdated,
      [LAST_CHECKED_COLUMN]: lastChecked,
    });
  }
}
