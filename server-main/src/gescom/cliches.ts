import knex from 'knex';

import {
  GescomWatcher,
  ARTICLE_REF_COLUMN,
  ARTICLE_DESIGNATION_COLUMN,
  ARTICLE_SOMMEIL_COLUMN,
  LAST_UPDATE_COLUMN,
  ARTICLE_TABLE_NAME,
  ARTICLE_NOMBRE_POSES_A_COLUMN,
  ARTICLE_NOMBRE_POSES_B_COLUMN,
  ARTICLE_NOMBRE_POSES_C_COLUMN,
  ARTICLE_NOMBRE_POSES_D_COLUMN,
  ARTICLE_COULEUR_1_COLUMN,
  ARTICLE_COULEUR_2_COLUMN,
  ARTICLE_COULEUR_3_COLUMN,
  ARTICLE_IMPORTANCE_ORDER_COULEURS_COLUMN,
} from '@root/gescom/common';

import {ClichesColumn, deleteCliches} from '@shared/db/cliches';
import {CLICHES_TABLE_NAME} from '@shared/db/table_names';
import {asString, asNumber, asDate} from '@shared/type_utils';

export const CLICHE_REF_PATTERN = '89%';

const CLICHE_COLUMNS = [
  ARTICLE_REF_COLUMN,
  ARTICLE_DESIGNATION_COLUMN,
  ARTICLE_NOMBRE_POSES_A_COLUMN,
  ARTICLE_NOMBRE_POSES_B_COLUMN,
  ARTICLE_NOMBRE_POSES_C_COLUMN,
  ARTICLE_NOMBRE_POSES_D_COLUMN,
  ARTICLE_COULEUR_1_COLUMN,
  ARTICLE_COULEUR_2_COLUMN,
  ARTICLE_COULEUR_3_COLUMN,
  ARTICLE_IMPORTANCE_ORDER_COULEURS_COLUMN,
  ARTICLE_SOMMEIL_COLUMN,
  LAST_UPDATE_COLUMN,
];

export class GescomWatcherCliches extends GescomWatcher {
  tableName = CLICHES_TABLE_NAME;

  protected fetch(): knex.QueryBuilder {
    return this.gescomDB(ARTICLE_TABLE_NAME)
      .select(CLICHE_COLUMNS)
      .where(ARTICLE_REF_COLUMN, 'like', CLICHE_REF_PATTERN);
  }

  protected mapGescomLineToSqliteLine(localDate: Date, gescomLine: any): any {
    return {
      [ClichesColumn.REF_COLUMN]: asString(gescomLine[ARTICLE_REF_COLUMN], undefined),
      [ClichesColumn.DESIGNATION_COLUMN]: asString(
        gescomLine[ARTICLE_DESIGNATION_COLUMN],
        undefined
      ),
      [ClichesColumn.NOMBRE_POSES_A_COLUMN]: asNumber(
        gescomLine[ARTICLE_NOMBRE_POSES_A_COLUMN],
        undefined
      ),
      [ClichesColumn.NOMBRE_POSES_B_COLUMN]: asNumber(
        gescomLine[ARTICLE_NOMBRE_POSES_B_COLUMN],
        undefined
      ),
      [ClichesColumn.NOMBRE_POSES_C_COLUMN]: asNumber(
        gescomLine[ARTICLE_NOMBRE_POSES_C_COLUMN],
        undefined
      ),
      [ClichesColumn.NOMBRE_POSES_D_COLUMN]: asNumber(
        gescomLine[ARTICLE_NOMBRE_POSES_D_COLUMN],
        undefined
      ),
      [ClichesColumn.COULEUR_1_COLUMN]: asString(gescomLine[ARTICLE_COULEUR_1_COLUMN], undefined),
      [ClichesColumn.COULEUR_2_COLUMN]: asString(gescomLine[ARTICLE_COULEUR_2_COLUMN], undefined),
      [ClichesColumn.COULEUR_3_COLUMN]: asString(gescomLine[ARTICLE_COULEUR_3_COLUMN], undefined),
      [ClichesColumn.COULEUR_4_COLUMN]: undefined,
      [ClichesColumn.COULEUR_5_COLUMN]: undefined,
      [ClichesColumn.COULEUR_6_COLUMN]: undefined,
      [ClichesColumn.IMPORTANCE_ORDRE_COULEURS_COLUMN]:
        asString(gescomLine[ARTICLE_IMPORTANCE_ORDER_COULEURS_COLUMN], 'NON') === 'OUI',
      [ClichesColumn.SOMMEIL_COLUMN]: asNumber(gescomLine[ARTICLE_SOMMEIL_COLUMN], 0) === 1,
      [ClichesColumn.LAST_UPDATE_COLUMN]: asDate(gescomLine[LAST_UPDATE_COLUMN]),
      [ClichesColumn.LOCAL_UPDATE_COLUMN]: localDate,
    };
  }

  protected async deleteRefs(refs: string[]): Promise<void> {
    return deleteCliches(this.sqliteDB, refs);
  }

  protected getRef(gescomLine: any): string {
    return asString(gescomLine[ARTICLE_REF_COLUMN], '');
  }
}
