import knex from 'knex';

import {CADENCIER_TABLE_NAME} from '@shared/db/table_names';
import {Vente} from '@shared/models';
import {asDate, asMap, asNumber, asString} from '@shared/type_utils';

export const CadencierColumns = {
  ID_COLUMN: 'id',
  BOBINE_REF_COLUMN: 'bobineRef',
  TYPE_COLUMN: 'type',
  VENTE_QUANTITE_COLUMN: 'quantity',
  VENTE_QUANTITE_DATE_COLUMN: 'date',
  LAST_UPDATE_COLUMN: 'lastUpdate',
  LOCAL_UPDATE_COLUMN: 'localUpdate',
};

export async function createCadencierTable(db: knex): Promise<void> {
  const hasTable = await db.schema.hasTable(CADENCIER_TABLE_NAME);
  if (!hasTable) {
    await db.schema.createTable(CADENCIER_TABLE_NAME, table => {
      table
        .string(CadencierColumns.ID_COLUMN)
        .notNullable()
        .primary();
      table.string(CadencierColumns.BOBINE_REF_COLUMN).notNullable();
      table.integer(CadencierColumns.TYPE_COLUMN).notNullable();
      table.integer(CadencierColumns.VENTE_QUANTITE_COLUMN).notNullable();
      table.dateTime(CadencierColumns.VENTE_QUANTITE_DATE_COLUMN).notNullable();
      table.dateTime(CadencierColumns.LAST_UPDATE_COLUMN);
      table.dateTime(CadencierColumns.LOCAL_UPDATE_COLUMN);
    });
  }
}

export async function deleteCadencier(db: knex, ids: string[]): Promise<void> {
  return db(CADENCIER_TABLE_NAME)
    .whereIn(CadencierColumns.ID_COLUMN, ids)
    .delete();
}

export async function listCadencier(db: knex, ref: string): Promise<Vente[]> {
  return db(CADENCIER_TABLE_NAME)
    .select()
    .map(cadencierLine => {
      const c = asMap(cadencierLine);
      return {
        id: asString(c, ''),
        refBobine: asString(c, ''),
        type: asNumber(c, -1),
        quantity: asNumber(c, 0),
        date: asDate(c),
        lastUpdate: asDate(c),
        localUpdate: asDate(c.localUpdate),
      };
    });
}
