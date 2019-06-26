import knex from 'knex';

import {BOBINE_FILLE_REF_PATTERN} from '@root/gescom/bobines_filles';
import {
  GescomWatcher,
  ARTICLE_REF_COLUMN,
  LAST_UPDATE_COLUMN,
  GESCOM_CADENCIER_TABLE_NAME,
  VENTE_REF,
  VENTE_QUANTITE_COLUMN,
  VENTE_QUANTITE_DATE_COLUMN,
  VENTE_DOCUMENT_TYPE_COLUMN,
  // DOCUMENT_TYPE_COMMANDE,
  // DOCUMENT_TYPE_LIVRAISON,
  // DOCUMENT_TYPE_FACTURE,
  // DOCUMENT_TYPE_FACTURE_COMPTABILISEE,
} from '@root/gescom/common';

import {CadencierColumns, deleteCadencier} from '@shared/db/cadencier';
import {CADENCIER_TABLE_NAME} from '@shared/db/table_names';
import {asString, asNumber, asDate} from '@shared/type_utils';

const CADENCIER_COLUMNS = [
  ARTICLE_REF_COLUMN,
  VENTE_REF,
  VENTE_DOCUMENT_TYPE_COLUMN,
  VENTE_QUANTITE_COLUMN,
  VENTE_QUANTITE_DATE_COLUMN,
  LAST_UPDATE_COLUMN,
];

// const DOCUMENT_TYPES = [
//   DOCUMENT_TYPE_COMMANDE,
//   DOCUMENT_TYPE_LIVRAISON,
//   DOCUMENT_TYPE_FACTURE,
//   DOCUMENT_TYPE_FACTURE_COMPTABILISEE,
// ];

export class GescomWatcherCadencier extends GescomWatcher {
  public tableName = CADENCIER_TABLE_NAME;

  protected fetch(): knex.QueryBuilder {
    return this.gescomDB(GESCOM_CADENCIER_TABLE_NAME)
      .select(CADENCIER_COLUMNS)
      .where(VENTE_DOCUMENT_TYPE_COLUMN, '<=', 8)
      .andWhere(ARTICLE_REF_COLUMN, 'like', BOBINE_FILLE_REF_PATTERN);
  }

  protected mapGescomLineToSqliteLine(localDate: Date, gescomLine: any): any {
    return {
      [CadencierColumns.ID_COLUMN]: this.getRef(gescomLine),
      [CadencierColumns.BOBINE_REF_COLUMN]: asString(gescomLine[ARTICLE_REF_COLUMN], undefined),
      [CadencierColumns.TYPE_COLUMN]: asNumber(gescomLine[VENTE_DOCUMENT_TYPE_COLUMN], -1),
      [CadencierColumns.VENTE_QUANTITE_COLUMN]: asNumber(gescomLine[VENTE_QUANTITE_COLUMN], 0),
      [CadencierColumns.VENTE_QUANTITE_DATE_COLUMN]: asDate(gescomLine[VENTE_QUANTITE_DATE_COLUMN]),
      [CadencierColumns.LAST_UPDATE_COLUMN]: asDate(gescomLine[LAST_UPDATE_COLUMN]),
      [CadencierColumns.LOCAL_UPDATE_COLUMN]: localDate,
    };
  }

  protected async deleteRefs(ids: string[]): Promise<void> {
    return deleteCadencier(this.sqliteDB, ids);
  }

  protected getRef(gescomLine: any): string {
    return gescomLine[VENTE_REF];
  }
}
