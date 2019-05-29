import knex from 'knex';

import {CLICHES_TABLE_NAME} from '@shared/db/table_names';
import {Cliche} from '@shared/models';
import {asDate, asMap, asNumber, asString} from '@shared/type_utils';

export const ClichesColumn = {
  REF_COLUMN: 'ref',
  DESIGNATION_COLUMN: 'designation',
  NOMBRE_POSES_A_COLUMN: 'nombrePosesA',
  NOMBRE_POSES_B_COLUMN: 'nombrePosesB',
  NOMBRE_POSES_C_COLUMN: 'nombrePosesC',
  NOMBRE_POSES_D_COLUMN: 'nombrePosesD',
  COULEUR_1_COLUMN: 'couleur1',
  COULEUR_2_COLUMN: 'couleur2',
  COULEUR_3_COLUMN: 'couleur3',
  COULEUR_4_COLUMN: 'couleur4',
  COULEUR_5_COLUMN: 'couleur5',
  COULEUR_6_COLUMN: 'couleur6',
  IMPORTANCE_ORDRE_COULEURS_COLUMN: 'importanceOrdreCouleurs',
  SOMMEIL_COLUMN: 'sommeil',
  LAST_UPDATE_COLUMN: 'lastUpdate',
  LOCAL_UPDATE_COLUMN: 'localUpdate',
};

export async function createClichesTable(db: knex): Promise<void> {
  const hasTable = await db.schema.hasTable(CLICHES_TABLE_NAME);
  if (!hasTable) {
    await db.schema.createTable(CLICHES_TABLE_NAME, table => {
      table
        .string(ClichesColumn.REF_COLUMN)
        .notNullable()
        .primary();
      table.string(ClichesColumn.DESIGNATION_COLUMN);
      table.integer(ClichesColumn.NOMBRE_POSES_A_COLUMN);
      table.integer(ClichesColumn.NOMBRE_POSES_B_COLUMN);
      table.integer(ClichesColumn.NOMBRE_POSES_C_COLUMN);
      table.integer(ClichesColumn.NOMBRE_POSES_D_COLUMN);
      table.string(ClichesColumn.COULEUR_1_COLUMN);
      table.string(ClichesColumn.COULEUR_2_COLUMN);
      table.string(ClichesColumn.COULEUR_3_COLUMN);
      table.string(ClichesColumn.COULEUR_4_COLUMN);
      table.string(ClichesColumn.COULEUR_5_COLUMN);
      table.string(ClichesColumn.COULEUR_6_COLUMN);
      table.boolean(ClichesColumn.IMPORTANCE_ORDRE_COULEURS_COLUMN);
      table.boolean(ClichesColumn.SOMMEIL_COLUMN);
      table.dateTime(ClichesColumn.LAST_UPDATE_COLUMN);
      table.dateTime(ClichesColumn.LOCAL_UPDATE_COLUMN);
    });
  }
}

export async function deleteCliches(db: knex, refs: string[]): Promise<void> {
  return db(CLICHES_TABLE_NAME)
    .whereIn(ClichesColumn.REF_COLUMN, refs)
    .delete();
}

export async function listCliches(db: knex, sinceLocalUpdate: number): Promise<Cliche[]> {
  return db(CLICHES_TABLE_NAME)
    .select()
    .where(ClichesColumn.LOCAL_UPDATE_COLUMN, '>', new Date(sinceLocalUpdate))
    .map(clicheLine => {
      const c = asMap(clicheLine);
      return {
        ref: asString(c.ref, ''),
        designation: asString(c.designation, undefined),
        nombrePosesA: asNumber(c.nombrePosesA, 0),
        nombrePosesB: asNumber(c.nombrePosesB, 0),
        nombrePosesC: asNumber(c.nombrePosesC, 0),
        nombrePosesD: asNumber(c.nombrePosesD, 0),
        couleur1: asString(c.couleur1, undefined),
        couleur2: asString(c.couleur2, undefined),
        couleur3: asString(c.couleur3, undefined),
        couleur4: asString(c.couleur4, undefined),
        couleur5: asString(c.couleur5, undefined),
        couleur6: asString(c.couleur6, undefined),
        importanceOrdreCouleurs: asNumber(c.importanceOrdreCouleurs, 0) === 1,
        sommeil: asNumber(c.sommeil, 0) === 1,
        lastUpdate: asDate(c.lastUpdate),
        localUpdate: asDate(c.localUpdate),
      };
    });
}
