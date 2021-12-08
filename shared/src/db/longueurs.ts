import knex from 'knex';

import {LONGUEURS_TABLE_NAME} from '@shared/db/table_names';
import {Longueurs} from '@shared/models';
import {asMap, asString, asNumber} from '@shared/type_utils';

export const LongueursColumn = {
  LONGUEUR_COLUMN: 'longueur',
  COLOR_REF_COLUMN: 'color_ref',
  REAL_LONGUEUR_COLUMN: 'real_longueur',
};

export async function createLongueursTable(db: knex): Promise<void> {
  const hasTable = await db.schema.hasTable(LONGUEURS_TABLE_NAME);
  if (!hasTable) {
    await db.schema.createTable(LONGUEURS_TABLE_NAME, table => {
      table.string(LongueursColumn.LONGUEUR_COLUMN).notNullable();
      table.string(LongueursColumn.COLOR_REF_COLUMN).nullable();
      table.string(LongueursColumn.REAL_LONGUEUR_COLUMN).notNullable();
      table.primary([LongueursColumn.LONGUEUR_COLUMN, LongueursColumn.COLOR_REF_COLUMN]);
    });
  }
}

export async function listLongueurs(db: knex): Promise<Longueurs[]> {
  return db(LONGUEURS_TABLE_NAME)
    .select()
    .map(longueurLine => {
      const l = asMap(longueurLine);
      return {
        longueur: asNumber(l[LongueursColumn.LONGUEUR_COLUMN], 0),
        colorRef: asString(l[LongueursColumn.COLOR_REF_COLUMN], undefined),
        realLongueur: asNumber(l[LongueursColumn.REAL_LONGUEUR_COLUMN], 0),
      };
    });
}
