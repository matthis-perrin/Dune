import knex from 'knex';

import {STOCKS_TABLE_NAME} from '@shared/db/table_names';
import {Stock} from '@shared/models';
import {asMap, asNumber, asString} from '@shared/type_utils';

export const StockColumns = {
  ID_COLUMN: 'id',
  REF_COLUMN: 'ref',
  NUM_DEPOT: 'numDepot',
  REEL_COLUMN: 'reel',
  COMMANDE_COLUMN: 'commande',
  RESERVE_COLUMN: 'reserve',
  LAST_UPDATE_COLUMN: 'lastUpdate',
  LOCAL_UPDATE_COLUMN: 'localUpdate',
};

export async function createStocksTable(db: knex, truncateGescom: boolean): Promise<void> {
  const hasTable = await db.schema.hasTable(STOCKS_TABLE_NAME);
  if (!hasTable) {
    await db.schema.createTable(STOCKS_TABLE_NAME, table => {
      table.string(StockColumns.ID_COLUMN).notNullable().primary();
      table.string(StockColumns.REF_COLUMN).notNullable();
      table.integer(StockColumns.NUM_DEPOT).notNullable();
      table.integer(StockColumns.REEL_COLUMN).notNullable();
      table.integer(StockColumns.COMMANDE_COLUMN).notNullable();
      table.integer(StockColumns.RESERVE_COLUMN).notNullable();
      table.dateTime(StockColumns.LAST_UPDATE_COLUMN).nullable();
      table.dateTime(StockColumns.LOCAL_UPDATE_COLUMN).nullable();
    });
  }
  if (truncateGescom) {
    await db(STOCKS_TABLE_NAME).truncate();
  }
}

export async function deleteStocks(db: knex, ids: string[]): Promise<void> {
  return db(STOCKS_TABLE_NAME).whereIn(StockColumns.ID_COLUMN, ids).delete();
}

export async function listStocks(db: knex, sinceLocalUpdate: number): Promise<Stock[]> {
  return db(STOCKS_TABLE_NAME)
    .select()
    .where(StockColumns.LOCAL_UPDATE_COLUMN, '>', new Date(sinceLocalUpdate))
    .map(stockLine => {
      const s = asMap(stockLine);
      return {
        id: asString(s.id, ''),
        numDepot: asNumber(s.numDepot, 0),
        ref: asString(s.ref, ''),
        reel: asNumber(s.reel, 0),
        commande: asNumber(s.commande, 0),
        reserve: asNumber(s.reserve, 0),
        lastUpdate: asNumber(s.lastUpdate, 0),
        localUpdate: asNumber(s.localUpdate, 0),
      };
    });
}
