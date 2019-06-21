import knex from 'knex';

import {BOBINES_QUANTITIES_TABLE_NAME} from '@shared/db/table_names';
import {BobineQuantities} from '@shared/models';
import {asMap, asNumber} from '@shared/type_utils';

export const BobinesQuantitiesColumns = {
  SOLD_MIN: 'sold_min',
  SOLD_MAX: 'sold_max',
  THRESHOLD: 'threshold',
  QTY_TO_PRODUCE: 'qty',
};

export async function createBobinesQuantitiesTable(db: knex): Promise<void> {
  const hasTable = await db.schema.hasTable(BOBINES_QUANTITIES_TABLE_NAME);
  if (!hasTable) {
    await db.schema.createTable(BOBINES_QUANTITIES_TABLE_NAME, table => {
      table.integer(BobinesQuantitiesColumns.SOLD_MIN).notNullable();
      table.integer(BobinesQuantitiesColumns.SOLD_MAX).notNullable();
      table.integer(BobinesQuantitiesColumns.THRESHOLD).notNullable();
      table.integer(BobinesQuantitiesColumns.QTY_TO_PRODUCE).notNullable();
    });
  }
}

export async function listBobinesQuantities(db: knex): Promise<BobineQuantities[]> {
  return db(BOBINES_QUANTITIES_TABLE_NAME)
    .select()
    .map(bobineQuantityLine => {
      const b = asMap(bobineQuantityLine);
      return {
        soldMin: asNumber(b[BobinesQuantitiesColumns.SOLD_MIN], 0),
        soldMax: asNumber(b[BobinesQuantitiesColumns.SOLD_MAX], 0),
        threshold: asNumber(b[BobinesQuantitiesColumns.THRESHOLD], 0),
        qtyToProduce: asNumber(b[BobinesQuantitiesColumns.QTY_TO_PRODUCE], 0),
      };
    });
}
