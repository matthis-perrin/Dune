import knex from 'knex';

import {PERFOS_TABLE_NAME} from '@shared/db/table_names';
import {Perfo} from '@shared/models';
import {asMap, asNumber, asString} from '@shared/type_utils';

export const PerfosColumn = {
  REF_COLUMN: 'ref',
  DECALAGE_INITIAL_COLUMN: 'decalageInitial',
  CALE_1_COLUMN: 'cale1',
  BAGUE_1_COLUMN: 'bague1',
  CALE_2_COLUMN: 'cale2',
  BAGUE_2_COLUMN: 'bague2',
  CALE_3_COLUMN: 'cale3',
  BAGUE_3_COLUMN: 'bague3',
  CALE_4_COLUMN: 'cale4',
  BAGUE_4_COLUMN: 'bague4',
  CALE_5_COLUMN: 'cale5',
  BAGUE_5_COLUMN: 'bague5',
  CALE_6_COLUMN: 'cale6',
  BAGUE_6_COLUMN: 'bague6',
  CALE_7_COLUMN: 'cale7',
  BAGUE_7_COLUMN: 'bague7',
  SOMMEIL_COLUMN: 'sommeil',
  LOCAL_UPDATE_COLUMN: 'localUpdate',
};

export async function createPerfosTable(db: knex): Promise<void> {
  const hasTable = await db.schema.hasTable(PERFOS_TABLE_NAME);
  if (!hasTable) {
    await db.schema.createTable(PERFOS_TABLE_NAME,table => {
      table.string(PerfosColumn.REF_COLUMN).notNullable().primary();
      table.integer(PerfosColumn.DECALAGE_INITIAL_COLUMN).notNullable();
      table.integer(PerfosColumn.CALE_1_COLUMN).nullable();
      table.integer(PerfosColumn.BAGUE_1_COLUMN).nullable();
      table.integer(PerfosColumn.CALE_2_COLUMN).nullable();
      table.integer(PerfosColumn.BAGUE_2_COLUMN).nullable();
      table.integer(PerfosColumn.CALE_3_COLUMN).nullable();
      table.integer(PerfosColumn.BAGUE_3_COLUMN).nullable();
      table.integer(PerfosColumn.CALE_4_COLUMN).nullable();
      table.integer(PerfosColumn.BAGUE_4_COLUMN).nullable();
      table.integer(PerfosColumn.CALE_5_COLUMN).nullable();
      table.integer(PerfosColumn.BAGUE_5_COLUMN).nullable();
      table.integer(PerfosColumn.CALE_6_COLUMN).nullable();
      table.integer(PerfosColumn.BAGUE_6_COLUMN).nullable();
      table.integer(PerfosColumn.CALE_7_COLUMN).nullable();
      table.integer(PerfosColumn.BAGUE_7_COLUMN).nullable();
      table.boolean(PerfosColumn.SOMMEIL_COLUMN).nullable();
      table.dateTime(PerfosColumn.LOCAL_UPDATE_COLUMN).nullable();
    });
  }
}

export async function deletePerfos(db: knex, refs: string[]): Promise<void> {
  return db(PERFOS_TABLE_NAME).whereIn(PerfosColumn.REF_COLUMN, refs).delete();
}

export async function listPerfos(db: knex, sinceLocalUpdate: number): Promise<Perfo[]> {
  return db(PERFOS_TABLE_NAME)
    .select()
    .where(PerfosColumn.LOCAL_UPDATE_COLUMN, '>', new Date(sinceLocalUpdate))
    .map(perfoLine => {
      const p = asMap(perfoLine);
      return {
        ref: asString(p[PerfosColumn.REF_COLUMN], ''),
        decalageInitial: asNumber(p[PerfosColumn.DECALAGE_INITIAL_COLUMN], 0),
        cale1: asNumber(p[PerfosColumn.CALE_1_COLUMN], undefined),
        bague1: asNumber(p[PerfosColumn.BAGUE_1_COLUMN], undefined),
        cale2: asNumber(p[PerfosColumn.CALE_2_COLUMN], undefined),
        bague2: asNumber(p[PerfosColumn.BAGUE_2_COLUMN], undefined),
        cale3: asNumber(p[PerfosColumn.CALE_3_COLUMN], undefined),
        bague3: asNumber(p[PerfosColumn.BAGUE_3_COLUMN], undefined),
        cale4: asNumber(p[PerfosColumn.CALE_4_COLUMN], undefined),
        bague4: asNumber(p[PerfosColumn.BAGUE_4_COLUMN], undefined),
        cale5: asNumber(p[PerfosColumn.CALE_5_COLUMN], undefined),
        bague5: asNumber(p[PerfosColumn.BAGUE_5_COLUMN], undefined),
        cale6: asNumber(p[PerfosColumn.CALE_6_COLUMN], undefined),
        bague6: asNumber(p[PerfosColumn.BAGUE_6_COLUMN], undefined),
        cale7: asNumber(p[PerfosColumn.CALE_7_COLUMN], undefined),
        bague7: asNumber(p[PerfosColumn.BAGUE_7_COLUMN], undefined),
        sommeil: asNumber(p[PerfosColumn.SOMMEIL_COLUMN], 0) === 1,
        localUpdate: asNumber(p[PerfosColumn.LOCAL_UPDATE_COLUMN], 0),
      };
    });
}
