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
import {asString, asNumber, asDate, asMap} from '@shared/type_utils';

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
  public tableName = CLICHES_TABLE_NAME;

  protected fetch(): knex.QueryBuilder {
    return this.gescomDB(ARTICLE_TABLE_NAME)
      .select(CLICHE_COLUMNS)
      .where(ARTICLE_REF_COLUMN, 'like', CLICHE_REF_PATTERN);
  }

  // tslint:disable-next-line:no-any
  protected mapGescomLineToSqliteLine(localDate: Date, gescomLine: any): any {
    const data = asMap(gescomLine);
    return {
      [ClichesColumn.REF_COLUMN]: asString(data[ARTICLE_REF_COLUMN], undefined),
      [ClichesColumn.DESIGNATION_COLUMN]: asString(data[ARTICLE_DESIGNATION_COLUMN], undefined),
      [ClichesColumn.NOMBRE_POSES_A_COLUMN]: asNumber(
        data[ARTICLE_NOMBRE_POSES_A_COLUMN],
        undefined
      ),
      [ClichesColumn.NOMBRE_POSES_B_COLUMN]: asNumber(
        data[ARTICLE_NOMBRE_POSES_B_COLUMN],
        undefined
      ),
      [ClichesColumn.NOMBRE_POSES_C_COLUMN]: asNumber(
        data[ARTICLE_NOMBRE_POSES_C_COLUMN],
        undefined
      ),
      [ClichesColumn.NOMBRE_POSES_D_COLUMN]: asNumber(
        data[ARTICLE_NOMBRE_POSES_D_COLUMN],
        undefined
      ),
      [ClichesColumn.COULEUR_1_COLUMN]: asString(data[ARTICLE_COULEUR_1_COLUMN], undefined),
      [ClichesColumn.COULEUR_2_COLUMN]: asString(data[ARTICLE_COULEUR_2_COLUMN], undefined),
      [ClichesColumn.COULEUR_3_COLUMN]: asString(data[ARTICLE_COULEUR_3_COLUMN], undefined),
      [ClichesColumn.COULEUR_4_COLUMN]: undefined,
      [ClichesColumn.COULEUR_5_COLUMN]: undefined,
      [ClichesColumn.COULEUR_6_COLUMN]: undefined,
      [ClichesColumn.IMPORTANCE_ORDRE_COULEURS_COLUMN]:
        asString(data[ARTICLE_IMPORTANCE_ORDER_COULEURS_COLUMN], 'NON') === 'OUI',
      [ClichesColumn.SOMMEIL_COLUMN]: asNumber(data[ARTICLE_SOMMEIL_COLUMN], 0) === 1,
      [ClichesColumn.LAST_UPDATE_COLUMN]: asDate(data[LAST_UPDATE_COLUMN]),
      [ClichesColumn.LOCAL_UPDATE_COLUMN]: localDate,
    };
  }

  protected async deleteRefs(refs: string[]): Promise<void> {
    return deleteCliches(this.sqliteDB, refs);
  }

  // tslint:disable-next-line:no-any
  protected getRef(gescomLine: any): string {
    return asString(asMap(gescomLine)[ARTICLE_REF_COLUMN], '');
  }
}
