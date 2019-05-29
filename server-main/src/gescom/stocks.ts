import knex from 'knex';

import {BOBINE_FILLE_REF_PATTERN} from '@root/gescom/bobines_filles';
import {BOBINE_MERE_REF_PATTERN} from '@root/gescom/bobines_meres';
import {
  GescomWatcher,
  ARTICLE_REF_COLUMN,
  LAST_UPDATE_COLUMN,
  GESCOM_STOCK_TABLE_NAME,
  STOCK_NUM_DEPOT,
  STOCK_REEL,
  STOCK_COMMANDE,
  STOCK_RESERVE,
} from '@root/gescom/common';

import {StockColumns, deleteStocks} from '@shared/db/stocks';
import {STOCKS_TABLE_NAME} from '@shared/db/table_names';
import {asString, asNumber, asDate} from '@shared/type_utils';

const STOCK_COLUMNS = [
  ARTICLE_REF_COLUMN,
  STOCK_NUM_DEPOT,
  STOCK_REEL,
  STOCK_COMMANDE,
  STOCK_RESERVE,
  LAST_UPDATE_COLUMN,
];

export class GescomWatcherStocks extends GescomWatcher {
  tableName = STOCKS_TABLE_NAME;

  protected fetch(): knex.QueryBuilder {
    // this.gescomDB(GESCOM_STOCK_TABLE_NAME)
    //   .select()
    //   .where(ARTICLE_REF_COLUMN, 'B140098AEP00')
    //   .then(console.log);

    // this.gescomDB(GESCOM_STOCK_TABLE_NAME)
    //   .select(ARTICLE_REF_COLUMN)
    //   .where(function() {
    //     this.where(ARTICLE_REF_COLUMN, 'like', BOBINE_FILLE_REF_PATTERN).orWhere(
    //       ARTICLE_REF_COLUMN,
    //       'like',
    //       BOBINE_MERE_REF_PATTERN
    //     );
    //   })
    //   .groupBy(ARTICLE_REF_COLUMN)
    //   .having(knex.raw('count(*) > 6'))
    //   .then(console.log);

    return this.gescomDB(GESCOM_STOCK_TABLE_NAME)
      .select(STOCK_COLUMNS)
      .where(function() {
        this.where(ARTICLE_REF_COLUMN, 'like', BOBINE_FILLE_REF_PATTERN).orWhere(
          ARTICLE_REF_COLUMN,
          'like',
          BOBINE_MERE_REF_PATTERN
        );
      });
  }

  protected mapGescomLineToSqliteLine(localDate: Date, gescomLine: any): any {
    return {
      [StockColumns.ID_COLUMN]: this.getRef(gescomLine),
      [StockColumns.REF_COLUMN]: asString(gescomLine[ARTICLE_REF_COLUMN], undefined),
      [StockColumns.NUM_DEPOT]: asNumber(gescomLine[STOCK_NUM_DEPOT], undefined),
      [StockColumns.REEL_COLUMN]: asNumber(gescomLine[STOCK_REEL], 0),
      [StockColumns.RESERVE_COLUMN]: asNumber(gescomLine[STOCK_RESERVE], 0),
      [StockColumns.COMMANDE_COLUMN]: asNumber(gescomLine[STOCK_REEL], 0),
      [StockColumns.LAST_UPDATE_COLUMN]: asDate(gescomLine[LAST_UPDATE_COLUMN]),
      [StockColumns.LOCAL_UPDATE_COLUMN]: localDate,
    };
  }

  protected async deleteRefs(ids: string[]): Promise<void> {
    return deleteStocks(this.sqliteDB, ids);
  }

  protected getRef(gescomLine: any): string {
    return `${gescomLine[ARTICLE_REF_COLUMN]}-${gescomLine[STOCK_NUM_DEPOT]}`;
  }
}
