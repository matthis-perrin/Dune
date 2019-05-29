import knex from 'knex';

import {BobineMereColumns, deleteBobinesMeres} from '@shared/db/bobines_meres';
import {BOBINES_MERES_TABLE_NAME} from '@shared/db/table_names';
import {asString, asNumber, asDate} from '@shared/type_utils';
import {
  GescomWatcher,
  ARTICLE_REF_COLUMN,
  ARTICLE_DESIGNATION_COLUMN,
  ARTICLE_LAIZE_COLUMN,
  ARTICLE_LONGUEUR_COLUMN,
  ARTICLE_COULEUR_PAPIER_COLUMN,
  ARTICLE_GRAMMAGE_COLUMN,
  ARTICLE_SOMMEIL_COLUMN,
  LAST_UPDATE_COLUMN,
  ARTICLE_TABLE_NAME,
  ARTICLE_LONGUEUR_BM_COLUMN,
} from '@root/gescom/common';

export const BOBINE_MERE_REF_PATTERN = '8[1-7]%';

const BOBINE_MERE_COLUMNS = [
  ARTICLE_REF_COLUMN,
  ARTICLE_DESIGNATION_COLUMN,
  ARTICLE_LAIZE_COLUMN,
  ARTICLE_LONGUEUR_BM_COLUMN,
  ARTICLE_COULEUR_PAPIER_COLUMN,
  ARTICLE_GRAMMAGE_COLUMN,
  ARTICLE_SOMMEIL_COLUMN,
  LAST_UPDATE_COLUMN,
];

export class GescomWatcherBobinesMeres extends GescomWatcher {
  tableName = BOBINES_MERES_TABLE_NAME;

  protected fetch(): knex.QueryBuilder {
    return this.gescomDB(ARTICLE_TABLE_NAME)
      .select(BOBINE_MERE_COLUMNS)
      .whereNotNull(ARTICLE_LAIZE_COLUMN)
      .andWhereNot(ARTICLE_LAIZE_COLUMN, '')
      .andWhere(ARTICLE_REF_COLUMN, 'like', BOBINE_MERE_REF_PATTERN);
  }

  protected mapGescomLineToSqliteLine(localDate: Date, gescomLine: any): any {
    return {
      [BobineMereColumns.REF_COLUMN]: asString(
        gescomLine[ARTICLE_REF_COLUMN],
        super.createRandomUnknownRef()
      ),
      [BobineMereColumns.DESIGNATION_COLUMN]: asString(
        gescomLine[ARTICLE_DESIGNATION_COLUMN],
        undefined
      ),
      [BobineMereColumns.LAIZE_COLUMN]: asNumber(gescomLine[ARTICLE_LAIZE_COLUMN], undefined),
      [BobineMereColumns.LONGUEUR_COLUMN]: asNumber(gescomLine[ARTICLE_LONGUEUR_COLUMN], undefined),
      [BobineMereColumns.COULEUR_PAPIER_COLUMN]: asString(
        gescomLine[ARTICLE_COULEUR_PAPIER_COLUMN],
        undefined
      ),
      [BobineMereColumns.GRAMMAGE_COLUMN]: asNumber(gescomLine[ARTICLE_GRAMMAGE_COLUMN], undefined),
      [BobineMereColumns.SOMMEIL_COLUMN]: asNumber(gescomLine[ARTICLE_SOMMEIL_COLUMN], 0) === 1,
      [BobineMereColumns.LAST_UPDATE_COLUMN]: asDate(gescomLine[LAST_UPDATE_COLUMN]),
      [BobineMereColumns.LOCAL_UPDATE_COLUMN]: localDate,
    };
  }

  protected async deleteRefs(refs: string[]): Promise<void> {
    return deleteBobinesMeres(this.sqliteDB, refs);
  }

  protected getRef(gescomLine: any): string {
    return asString(gescomLine[ARTICLE_REF_COLUMN], '');
  }
}
