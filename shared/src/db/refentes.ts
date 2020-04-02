import knex from 'knex';

import {REFENTES_TABLE_NAME} from '@shared/db/table_names';
import {Refente} from '@shared/models';
import {asMap, asNumber, asString} from '@shared/type_utils';

export const RefentesColumn = {
  REF_COLUMN: 'ref',
  REF_PERFO_COLUMN: 'refPerfo',
  DECALAGE_COLUMN: 'decalage',
  LAIZE_1_COLUMN: 'laize1',
  LAIZE_2_COLUMN: 'laize2',
  LAIZE_3_COLUMN: 'laize3',
  LAIZE_4_COLUMN: 'laize4',
  LAIZE_5_COLUMN: 'laize5',
  LAIZE_6_COLUMN: 'laize6',
  LAIZE_7_COLUMN: 'laize7',
  CHUTE_COLUMN: 'chute',
  SOMMEIL_COLUMN: 'sommeil',
  LOCAL_UPDATE_COLUMN: 'localUpdate',
};

export async function createRefentesTable(db: knex): Promise<void> {
  const hasTable = await db.schema.hasTable(REFENTES_TABLE_NAME);
  if (!hasTable) {
    await db.schema.createTable(REFENTES_TABLE_NAME,table => {
      table.string(RefentesColumn.REF_COLUMN).notNullable().primary();
      table.string(RefentesColumn.REF_PERFO_COLUMN).notNullable();
      table.integer(RefentesColumn.DECALAGE_COLUMN).notNullable();
      table.integer(RefentesColumn.LAIZE_1_COLUMN).nullable();
      table.integer(RefentesColumn.LAIZE_2_COLUMN).nullable();
      table.integer(RefentesColumn.LAIZE_3_COLUMN).nullable();
      table.integer(RefentesColumn.LAIZE_4_COLUMN).nullable();
      table.integer(RefentesColumn.LAIZE_5_COLUMN).nullable();
      table.integer(RefentesColumn.LAIZE_6_COLUMN).nullable();
      table.integer(RefentesColumn.LAIZE_7_COLUMN).nullable();
      table.integer(RefentesColumn.CHUTE_COLUMN).nullable();
      table.boolean(RefentesColumn.SOMMEIL_COLUMN).nullable();
      table.dateTime(RefentesColumn.LOCAL_UPDATE_COLUMN).nullable();
    });
  }
}

export async function deleteRefentes(db: knex, refs: string[]): Promise<void> {
  return db(REFENTES_TABLE_NAME).whereIn(RefentesColumn.REF_COLUMN, refs).delete();
}

export async function listRefentes(db: knex, sinceLocalUpdate: number): Promise<Refente[]> {
  return db(REFENTES_TABLE_NAME)
    .select()
    .where(RefentesColumn.LOCAL_UPDATE_COLUMN, '>', new Date(sinceLocalUpdate))
    .map(refenteLine => {
      const r = asMap(refenteLine);
      return {
        ref: asString(r[RefentesColumn.REF_COLUMN], ''),
        refPerfo: asString(r[RefentesColumn.REF_PERFO_COLUMN], ''),
        decalage: asNumber(r[RefentesColumn.DECALAGE_COLUMN], 0),
        laize1: asNumber(r[RefentesColumn.LAIZE_1_COLUMN], undefined),
        laize2: asNumber(r[RefentesColumn.LAIZE_2_COLUMN], undefined),
        laize3: asNumber(r[RefentesColumn.LAIZE_3_COLUMN], undefined),
        laize4: asNumber(r[RefentesColumn.LAIZE_4_COLUMN], undefined),
        laize5: asNumber(r[RefentesColumn.LAIZE_5_COLUMN], undefined),
        laize6: asNumber(r[RefentesColumn.LAIZE_6_COLUMN], undefined),
        laize7: asNumber(r[RefentesColumn.LAIZE_7_COLUMN], undefined),
        chute: asNumber(r[RefentesColumn.CHUTE_COLUMN], undefined),
        sommeil: asNumber(r[RefentesColumn.SOMMEIL_COLUMN], 0) === 1,
        localUpdate: asNumber(r[RefentesColumn.LOCAL_UPDATE_COLUMN], 0),
      };
    });
}
