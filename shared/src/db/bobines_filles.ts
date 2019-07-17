import knex from 'knex';

import {BOBINES_FILLES_TABLE_NAME} from '@shared/db/table_names';
import {BobineFille} from '@shared/models';
import {asMap, asNumber, asString} from '@shared/type_utils';

export const BobineFilleColumns = {
  REF_COLUMN: 'ref',
  DESIGNATION_COLUMN: 'designation',
  DESIGNATION_OPERATEUR_COLUMN: 'designationOperateur',
  LAIZE_COLUMN: 'laize',
  LONGUEUR_COLUMN: 'longueur',
  COULEUR_PAPIER_COLUMN: 'couleurPapier',
  GRAMMAGE_COLUMN: 'grammage',
  REF_CLICHE_1_COLUMN: 'refCliche1',
  REF_CLICHE_2_COLUMN: 'refCliche2',
  TYPE_IMPRESSION_COLUMN: 'typeImpression',
  SOMMEIL_COLUMN: 'sommeil',
  LAST_UPDATE_COLUMN: 'lastUpdate',
  LOCAL_UPDATE_COLUMN: 'localUpdate',
};

export async function createBobinesFillesTable(db: knex): Promise<void> {
  const hasTable = await db.schema.hasTable(BOBINES_FILLES_TABLE_NAME);
  if (!hasTable) {
    await db.schema.createTable(BOBINES_FILLES_TABLE_NAME, table => {
      table
        .string(BobineFilleColumns.REF_COLUMN)
        .notNullable()
        .primary();
      table.string(BobineFilleColumns.DESIGNATION_COLUMN);
      table.string(BobineFilleColumns.DESIGNATION_OPERATEUR_COLUMN);
      table.integer(BobineFilleColumns.LAIZE_COLUMN);
      table.integer(BobineFilleColumns.LONGUEUR_COLUMN);
      table.string(BobineFilleColumns.COULEUR_PAPIER_COLUMN);
      table.integer(BobineFilleColumns.GRAMMAGE_COLUMN);
      table.string(BobineFilleColumns.REF_CLICHE_1_COLUMN);
      table.string(BobineFilleColumns.REF_CLICHE_2_COLUMN);
      table.string(BobineFilleColumns.TYPE_IMPRESSION_COLUMN);
      table.boolean(BobineFilleColumns.SOMMEIL_COLUMN);
      table.dateTime(BobineFilleColumns.LAST_UPDATE_COLUMN);
      table.dateTime(BobineFilleColumns.LOCAL_UPDATE_COLUMN);
    });
  }
}

export async function deleteBobinesFilles(db: knex, refs: string[]): Promise<void> {
  return db(BOBINES_FILLES_TABLE_NAME)
    .whereIn(BobineFilleColumns.REF_COLUMN, refs)
    .delete();
}

export async function listBobinesFilles(
  db: knex,
  sinceLocalUpdate: number
): Promise<BobineFille[]> {
  return db(BOBINES_FILLES_TABLE_NAME)
    .select()
    .where(BobineFilleColumns.LOCAL_UPDATE_COLUMN, '>', new Date(sinceLocalUpdate))
    .map(bobineFilleLine => {
      const b = asMap(bobineFilleLine);
      return {
        ref: asString(b[BobineFilleColumns.REF_COLUMN], ''),
        designation: asString(b[BobineFilleColumns.DESIGNATION_COLUMN], undefined),
        designationOperateur: asString(
          b[BobineFilleColumns.DESIGNATION_OPERATEUR_COLUMN],
          undefined
        ),
        laize: asNumber(b[BobineFilleColumns.LAIZE_COLUMN], undefined),
        longueur: asNumber(b[BobineFilleColumns.LONGUEUR_COLUMN], undefined),
        couleurPapier: asString(b[BobineFilleColumns.COULEUR_PAPIER_COLUMN], undefined),
        grammage: asNumber(b[BobineFilleColumns.GRAMMAGE_COLUMN], undefined),
        refCliche1: asString(b[BobineFilleColumns.REF_CLICHE_1_COLUMN], undefined),
        refCliche2: asString(b[BobineFilleColumns.REF_CLICHE_2_COLUMN], undefined),
        typeImpression: asString(b[BobineFilleColumns.TYPE_IMPRESSION_COLUMN], undefined),
        sommeil: asNumber(b[BobineFilleColumns.SOMMEIL_COLUMN], 0) === 1,
        lastUpdate: asNumber(b[BobineFilleColumns.LAST_UPDATE_COLUMN], 0),
        localUpdate: asNumber(b[BobineFilleColumns.LOCAL_UPDATE_COLUMN], 0),
      };
    });
}
