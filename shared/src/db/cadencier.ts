import knex from 'knex';

import {CADENCIER_TABLE_NAME} from '@shared/db/table_names';
import {Vente} from '@shared/models';
import {asMap, asNumber, asString} from '@shared/type_utils';

export const CadencierColumns = {
  ID_COLUMN: 'id',
  BOBINE_REF_COLUMN: 'bobineRef',
  TYPE_COLUMN: 'type',
  VENTE_QUANTITE_COLUMN: 'quantity',
  VENTE_QUANTITE_DATE_COLUMN: 'date',
  LAST_UPDATE_COLUMN: 'lastUpdate',
  LOCAL_UPDATE_COLUMN: 'localUpdate',
};

export async function createCadencierTable(db: knex, truncateGescom: boolean): Promise<void> {
  const hasTable = await db.schema.hasTable(CADENCIER_TABLE_NAME);
  if (!hasTable) {
    await db.schema.createTable(CADENCIER_TABLE_NAME, table => {
      table.string(CadencierColumns.ID_COLUMN).notNullable().primary();
      table.string(CadencierColumns.BOBINE_REF_COLUMN).notNullable();
      table.integer(CadencierColumns.TYPE_COLUMN).notNullable();
      table.integer(CadencierColumns.VENTE_QUANTITE_COLUMN).notNullable();
      table.dateTime(CadencierColumns.VENTE_QUANTITE_DATE_COLUMN).notNullable();
      table.dateTime(CadencierColumns.LAST_UPDATE_COLUMN).nullable();
      table.dateTime(CadencierColumns.LOCAL_UPDATE_COLUMN).nullable();
    });
  }
  if (truncateGescom) {
    await db(CADENCIER_TABLE_NAME).truncate();
  }
}

export async function deleteCadencier(db: knex, ids: string[]): Promise<void> {
  return db(CADENCIER_TABLE_NAME).whereIn(CadencierColumns.ID_COLUMN, ids).delete();
}

export async function listCadencier(db: knex, sinceLocalUpdate: number): Promise<Vente[]> {
  return (
    db(CADENCIER_TABLE_NAME)
      .select()
      .where(CadencierColumns.LOCAL_UPDATE_COLUMN, '>', new Date(sinceLocalUpdate))
      // tslint:disable-next-line:no-any
      .map((cadencierLine: any) => {
        const c = asMap(cadencierLine);
        return {
          id: asString(c[CadencierColumns.ID_COLUMN], ''),
          bobineRef: asString(c[CadencierColumns.BOBINE_REF_COLUMN], ''),
          type: asNumber(c[CadencierColumns.TYPE_COLUMN], -1),
          quantity: asNumber(c[CadencierColumns.VENTE_QUANTITE_COLUMN], 0),
          date: asNumber(c[CadencierColumns.VENTE_QUANTITE_DATE_COLUMN], 0),
          lastUpdate: asNumber(c[CadencierColumns.LAST_UPDATE_COLUMN], 0),
          localUpdate: asNumber(c[CadencierColumns.LOCAL_UPDATE_COLUMN], 0),
        };
      })
  );
}
