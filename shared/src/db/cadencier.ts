import knex from 'knex';

import {CADENCIER_TABLE_NAME} from '@shared/db/table_names';
import {VenteLight} from '@shared/models';
import {asDate, asMap, asNumber} from '@shared/type_utils';

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

export async function listCadencier(db: knex, ref: string): Promise<VenteLight[]> {
  return db(CADENCIER_TABLE_NAME)
    .select([
      CadencierColumns.TYPE_COLUMN,
      CadencierColumns.VENTE_QUANTITE_COLUMN,
      CadencierColumns.VENTE_QUANTITE_DATE_COLUMN,
    ])
    .where(CadencierColumns.BOBINE_REF_COLUMN, '=', ref)
    .map(cadencierLine => {
      const c = asMap(cadencierLine);
      return {
        type: asNumber(c[CadencierColumns.TYPE_COLUMN], -1),
        quantity: asNumber(c[CadencierColumns.VENTE_QUANTITE_COLUMN], 0),
        date: asNumber(c[CadencierColumns.VENTE_QUANTITE_DATE_COLUMN], 0),
      };
    });
}
