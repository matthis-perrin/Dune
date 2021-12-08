import knex from 'knex';

import {
  GescomWatcher,
  ARTICLE_REF_COLUMN,
  ARTICLE_DESIGNATION_COLUMN,
  ARTICLE_DESIGNATION_OPERATOR_COLUMN,
  ARTICLE_LAIZE_COLUMN,
  ARTICLE_LONGUEUR_COLUMN,
  ARTICLE_COULEUR_PAPIER_COLUMN,
  ARTICLE_GRAMMAGE_COLUMN,
  ARTICLE_REF_CLICHE_1_COLUMN,
  ARTICLE_REF_CLICHE_2_COLUMN,
  ARTICLE_TYPE_IMPRESSION_COLUMN,
  ARTICLE_SOMMEIL_COLUMN,
  LAST_UPDATE_COLUMN,
  ARTICLE_TABLE_NAME,
} from '@root/gescom/common';

import {BobineFilleColumns, deleteBobinesFilles} from '@shared/db/bobines_filles';
import {BOBINES_FILLES_TABLE_NAME} from '@shared/db/table_names';
import {asString, asNumber, asDate, asMap} from '@shared/type_utils';

export const BOBINE_FILLE_REF_PATTERN = 'B[0-9]%';

const BOBINE_FILLE_COLUMNS = [
  ARTICLE_REF_COLUMN,
  ARTICLE_DESIGNATION_COLUMN,
  ARTICLE_DESIGNATION_OPERATOR_COLUMN,
  ARTICLE_LAIZE_COLUMN,
  ARTICLE_LONGUEUR_COLUMN,
  ARTICLE_COULEUR_PAPIER_COLUMN,
  ARTICLE_GRAMMAGE_COLUMN,
  ARTICLE_REF_CLICHE_1_COLUMN,
  ARTICLE_REF_CLICHE_2_COLUMN,
  ARTICLE_TYPE_IMPRESSION_COLUMN,
  ARTICLE_SOMMEIL_COLUMN,
  LAST_UPDATE_COLUMN,
];

export class GescomWatcherBobinesFilles extends GescomWatcher {
  public tableName = BOBINES_FILLES_TABLE_NAME;

  protected fetch(): knex.QueryBuilder {
    return this.gescomDB(ARTICLE_TABLE_NAME)
      .select(BOBINE_FILLE_COLUMNS)
      .where(ARTICLE_REF_COLUMN, 'like', BOBINE_FILLE_REF_PATTERN);
  }

  // tslint:disable-next-line:no-any
  protected mapGescomLineToSqliteLine(localDate: Date, gescomLine: any): any {
    const data = asMap(gescomLine);
    return {
      [BobineFilleColumns.REF_COLUMN]: asString(
        data[ARTICLE_REF_COLUMN],
        super.createRandomUnknownRef()
      ),
      [BobineFilleColumns.DESIGNATION_COLUMN]: asString(
        data[ARTICLE_DESIGNATION_COLUMN],
        undefined
      ),
      [BobineFilleColumns.DESIGNATION_OPERATEUR_COLUMN]: asString(
        data[ARTICLE_DESIGNATION_OPERATOR_COLUMN],
        undefined
      ),
      [BobineFilleColumns.LAIZE_COLUMN]: asNumber(data[ARTICLE_LAIZE_COLUMN], undefined),
      [BobineFilleColumns.LONGUEUR_COLUMN]: asNumber(data[ARTICLE_LONGUEUR_COLUMN], undefined),
      [BobineFilleColumns.COULEUR_PAPIER_COLUMN]: asString(
        data[ARTICLE_COULEUR_PAPIER_COLUMN],
        undefined
      ),
      [BobineFilleColumns.GRAMMAGE_COLUMN]: asNumber(data[ARTICLE_GRAMMAGE_COLUMN], undefined),
      [BobineFilleColumns.REF_CLICHE_1_COLUMN]: asString(
        data[ARTICLE_REF_CLICHE_1_COLUMN],
        undefined
      ),
      [BobineFilleColumns.REF_CLICHE_2_COLUMN]: asString(
        data[ARTICLE_REF_CLICHE_2_COLUMN],
        undefined
      ),
      [BobineFilleColumns.TYPE_IMPRESSION_COLUMN]: asString(
        data[ARTICLE_TYPE_IMPRESSION_COLUMN],
        undefined
      ),
      [BobineFilleColumns.SOMMEIL_COLUMN]: asNumber(data[ARTICLE_SOMMEIL_COLUMN], 0) === 1,
      [BobineFilleColumns.LAST_UPDATE_COLUMN]: asDate(data[LAST_UPDATE_COLUMN]),
      [BobineFilleColumns.LOCAL_UPDATE_COLUMN]: localDate,
    };
  }
  protected async deleteRefs(refs: string[]): Promise<void> {
    return deleteBobinesFilles(this.sqliteDB, refs);
  }

  // tslint:disable-next-line:no-any
  protected getRef(gescomLine: any): string {
    return asString(asMap(gescomLine)[ARTICLE_REF_COLUMN], '');
  }
}
