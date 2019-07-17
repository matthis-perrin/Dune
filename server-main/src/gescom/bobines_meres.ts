import knex from 'knex';

import {
  GescomWatcher,
  ARTICLE_REF_COLUMN,
  ARTICLE_DESIGNATION_COLUMN,
  ARTICLE_LAIZE_COLUMN,
  ARTICLE_COULEUR_PAPIER_COLUMN,
  ARTICLE_GRAMMAGE_COLUMN,
  ARTICLE_SOMMEIL_COLUMN,
  LAST_UPDATE_COLUMN,
  ARTICLE_TABLE_NAME,
  ARTICLE_LONGUEUR_BM_COLUMN,
} from '@root/gescom/common';

import {BobineMereColumns, deleteBobinesMeres} from '@shared/db/bobines_meres';
import {BOBINES_MERES_TABLE_NAME} from '@shared/db/table_names';
import {asString, asNumber, asDate, asMap} from '@shared/type_utils';

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
  public tableName = BOBINES_MERES_TABLE_NAME;

  protected fetch(): knex.QueryBuilder {
    return this.gescomDB(ARTICLE_TABLE_NAME)
      .select(BOBINE_MERE_COLUMNS)
      .whereNotNull(ARTICLE_LAIZE_COLUMN)
      .andWhereNot(ARTICLE_LAIZE_COLUMN, '')
      .andWhere(ARTICLE_REF_COLUMN, 'like', BOBINE_MERE_REF_PATTERN);
  }

  // tslint:disable-next-line:no-any
  protected mapGescomLineToSqliteLine(localDate: Date, gescomLine: any): any {
    const data = asMap(gescomLine);
    return {
      [BobineMereColumns.REF_COLUMN]: asString(
        data[ARTICLE_REF_COLUMN],
        super.createRandomUnknownRef()
      ),
      [BobineMereColumns.DESIGNATION_COLUMN]: asString(data[ARTICLE_DESIGNATION_COLUMN], undefined),
      [BobineMereColumns.LAIZE_COLUMN]: asNumber(data[ARTICLE_LAIZE_COLUMN], undefined),
      [BobineMereColumns.LONGUEUR_COLUMN]: asNumber(data[ARTICLE_LONGUEUR_BM_COLUMN], undefined),
      [BobineMereColumns.COULEUR_PAPIER_COLUMN]: asString(
        data[ARTICLE_COULEUR_PAPIER_COLUMN],
        undefined
      ),
      [BobineMereColumns.GRAMMAGE_COLUMN]: asNumber(data[ARTICLE_GRAMMAGE_COLUMN], undefined),
      [BobineMereColumns.SOMMEIL_COLUMN]: asNumber(data[ARTICLE_SOMMEIL_COLUMN], 0) === 1,
      [BobineMereColumns.LAST_UPDATE_COLUMN]: asDate(data[LAST_UPDATE_COLUMN]),
      [BobineMereColumns.LOCAL_UPDATE_COLUMN]: localDate,
    };
  }

  protected async deleteRefs(refs: string[]): Promise<void> {
    return deleteBobinesMeres(this.sqliteDB, refs);
  }

  // tslint:disable-next-line:no-any
  protected getRef(gescomLine: any): string {
    return asString(asMap(gescomLine)[ARTICLE_REF_COLUMN], '');
  }
}
