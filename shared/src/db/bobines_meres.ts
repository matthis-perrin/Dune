import knex from 'knex';

import {BOBINES_MERES_TABLE_NAME} from '@shared/db/table_names';
import {BobineMere} from '@shared/models';
import {asMap, asNumber, asString} from '@shared/type_utils';

export const BobineMereColumns = {
  REF_COLUMN: 'ref',
  DESIGNATION_COLUMN: 'designation',
  LAIZE_COLUMN: 'laize',
  LONGUEUR_COLUMN: 'longueur',
  COULEUR_PAPIER_COLUMN: 'couleurPapier',
  GRAMMAGE_COLUMN: 'grammage',
  SOMMEIL_COLUMN: 'sommeil',
  LAST_UPDATE_COLUMN: 'lastUpdate',
  LOCAL_UPDATE_COLUMN: 'localUpdate',
};

export async function createBobinesMeresTable(db: knex, truncateGescom: boolean): Promise<void> {
  const hasTable = await db.schema.hasTable(BOBINES_MERES_TABLE_NAME);
  if (!hasTable) {
    await db.schema.createTable(BOBINES_MERES_TABLE_NAME, table => {
      table.string(BobineMereColumns.REF_COLUMN).notNullable().primary();
      table.string(BobineMereColumns.DESIGNATION_COLUMN).nullable();
      table.integer(BobineMereColumns.LAIZE_COLUMN).nullable();
      table.integer(BobineMereColumns.LONGUEUR_COLUMN).nullable();
      table.string(BobineMereColumns.COULEUR_PAPIER_COLUMN).nullable();
      table.integer(BobineMereColumns.GRAMMAGE_COLUMN).nullable();
      table.boolean(BobineMereColumns.SOMMEIL_COLUMN).nullable();
      table.dateTime(BobineMereColumns.LAST_UPDATE_COLUMN).nullable();
      table.dateTime(BobineMereColumns.LOCAL_UPDATE_COLUMN).nullable();
    });
  }
  if (truncateGescom) {
    await db(BOBINES_MERES_TABLE_NAME).truncate();
  }
}

export async function deleteBobinesMeres(db: knex, refs: string[]): Promise<void> {
  return db(BOBINES_MERES_TABLE_NAME).whereIn(BobineMereColumns.REF_COLUMN, refs).delete();
}

export async function listBobinesMeres(db: knex, sinceLocalUpdate: number): Promise<BobineMere[]> {
  return db(BOBINES_MERES_TABLE_NAME)
    .select()
    .where(BobineMereColumns.LOCAL_UPDATE_COLUMN, '>', new Date(sinceLocalUpdate))
    .map(bobineMereLine => {
      const b = asMap(bobineMereLine);
      return {
        ref: asString(b.ref, ''),
        designation: asString(b.designation, undefined),
        laize: asNumber(b.laize, undefined),
        longueur: asNumber(b.longueur, undefined),
        couleurPapier: asString(b.couleurPapier, undefined),
        grammage: asNumber(b.grammage, undefined),
        sommeil: asNumber(b.sommeil, 0) === 1,
        lastUpdate: asNumber(b.lastUpdate, 0),
        localUpdate: asNumber(b.localUpdate, 0),
      };
    });
}
