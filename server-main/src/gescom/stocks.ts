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
  STOCK_PREPARE,
  STOCK_RESERVE,
} from '@root/gescom/common';

import {StockColumns, deleteStocks} from '@shared/db/stocks';
import {STOCKS_TABLE_NAME} from '@shared/db/table_names';
import {asString, asNumber, asDate, asMap} from '@shared/type_utils';

const STOCK_COLUMNS = [
  ARTICLE_REF_COLUMN,
  STOCK_NUM_DEPOT,
  STOCK_REEL,
  STOCK_COMMANDE,
  STOCK_RESERVE,
  STOCK_PREPARE,
  LAST_UPDATE_COLUMN,
];

export class GescomWatcherStocks extends GescomWatcher {
  public tableName = STOCKS_TABLE_NAME;

  protected fetch(): knex.QueryBuilder {
    return this.gescomDB(GESCOM_STOCK_TABLE_NAME)
      .select(STOCK_COLUMNS)
      .where(function (): void {
        this.where(ARTICLE_REF_COLUMN, 'like', BOBINE_FILLE_REF_PATTERN).orWhere(
          ARTICLE_REF_COLUMN,
          'like',
          BOBINE_MERE_REF_PATTERN
        );
      });
  }

  // tslint:disable-next-line:no-any
  protected mapGescomLineToSqliteLine(localDate: Date, gescomLine: any): any {
    const data = asMap(gescomLine);
    return {
      [StockColumns.ID_COLUMN]: this.getRef(data),
      [StockColumns.REF_COLUMN]: asString(data[ARTICLE_REF_COLUMN], undefined),
      [StockColumns.NUM_DEPOT]: asNumber(data[STOCK_NUM_DEPOT], undefined),
      [StockColumns.REEL_COLUMN]: asNumber(data[STOCK_REEL], 0),
      [StockColumns.RESERVE_COLUMN]:
        asNumber(data[STOCK_RESERVE], 0) + asNumber(data[STOCK_PREPARE], 0),
      [StockColumns.COMMANDE_COLUMN]: asNumber(data[STOCK_COMMANDE], 0),
      [StockColumns.LAST_UPDATE_COLUMN]: asDate(data[LAST_UPDATE_COLUMN]),
      [StockColumns.LOCAL_UPDATE_COLUMN]: localDate,
    };
  }

  protected async deleteRefs(ids: string[]): Promise<void> {
    return deleteStocks(this.sqliteDB, ids);
  }

  // tslint:disable-next-line:no-any
  protected getRef(gescomLine: any): string {
    const line = asMap(gescomLine);
    return `${line[ARTICLE_REF_COLUMN]}-${line[STOCK_NUM_DEPOT]}`;
  }
}
