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
  tableName = CADENCIER_TABLE_NAME;

  protected fetch(): knex.QueryBuilder {
    // const dateFormat = `FORMAT(DO_Date, 'yy-MM')`;
    // console.log('Test');

    // this.gescomDB(GESCOM_CADENCIER_TABLE_NAME)
    //   .select(knex.raw('DO_Piece, count(DO_Piece)'))
    //   .groupBy('DO_Piece')
    //   .havingRaw('count(DO_Piece) > 1')
    //   .then(l => {
    //     console.log('Hello success');
    //     l.forEach(ll => console.log(ll));
    //     console.log('Hello after');
    //     // console.log(JSON.stringify(l, undefined, 2));
    //   })
    //   .catch(err => {
    //     console.log('Hello error');
    //     console.error(err);
    //   })
    //   .finally(() => process.exit(-1));

    // this.gescomDB(GESCOM_CADENCIER_TABLE_NAME)
    //   .select()
    //   .where('DO_Piece', '=', '1307262')
    //   .then(l => {
    //     console.log('Hello success');
    //     l.forEach(ll => console.log(ll));
    //     console.log('Hello after');
    //     // console.log(JSON.stringify(l, undefined, 2));
    //   })
    //   .catch(err => {
    //     console.log('Hello error');
    //     console.error(err);
    //   })
    //   .finally(() => process.exit(-1));

    // this.gescomDB(GESCOM_CADENCIER_TABLE_NAME)
    //   .select()
    //   //   .select(knex.raw(`FORMAT(DO_Date, 'dd-yy-MM') as formattedDate`))
    //   //   // .sum(VENTE_QUANTITE_COLUMN)
    //   //   // .sum('DL_QteBC')
    //   //   // .sum('DL_QteBL')
    //   .where(ARTICLE_REF_COLUMN, '=', 'B140070ANP00')
    //   .andWhere(VENTE_QUANTITE_COLUMN, '=', 48)
    //   //   .whereIn(VENTE_DOCUMENT_TYPE_COLUMN, [4, 6, 7, 14, 17])
    //   //   // .groupBy(VENTE_DOCUMENT_TYPE_COLUMN)
    //   //   // .groupByRaw(`FORMAT(DO_Date, 'dd-yy-MM')`)
    //   //   .orderBy('formattedDate')
    //   .then(l => {
    //     console.log('Hello success');
    //     l.forEach(ll => console.log(ll));
    //     console.log('Hello after');
    //     // console.log(JSON.stringify(l, undefined, 2));
    //   })
    //   .catch(err => {
    //     console.log('Hello error');
    //     console.error(err);
    //   })
    //   .finally(() => process.exit(-1));

    //   .then(lines => {
    //     console.log(
    //       lines.map(l => `${l['DO_Type']},${l['DL_Qte']},${l['formattedDate']}`).join('\n')
    //     );
    //   });
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
