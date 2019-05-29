import knex from 'knex';

import {BOBINES_FILLES_TABLE_NAME} from '@shared/db/table_names';
import {BobineFille} from '@shared/models';
import {asDate, asMap, asNumber, asString} from '@shared/type_utils';

export const BobineFilleColumns = {
  REF_COLUMN: 'ref',
  DESIGNATION_COLUMN: 'designation',
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
        ref: asString(b.ref, ''),
        designation: asString(b.designation, undefined),
        laize: asNumber(b.laize, undefined),
        longueur: asNumber(b.longueur, undefined),
        couleurPapier: asString(b.couleurPapier, undefined),
        grammage: asNumber(b.grammage, undefined),
        refCliche1: asString(b.refCliche1, undefined),
        refCliche2: asString(b.refCliche2, undefined),
        typeImpression: asString(b.typeImpression, undefined),
        sommeil: asNumber(b.sommeil, 0) === 1,
        lastUpdate: asDate(b.lastUpdate),
        localUpdate: asDate(b.localUpdate),
      };
    });
}
