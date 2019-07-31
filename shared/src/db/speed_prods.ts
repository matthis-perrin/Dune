import knex from 'knex';

import {SPEED_PRODS_TABLE_NAME} from '@shared/db/table_names';
import {Prod} from '@shared/models';
import {asNumber, asMap, asArray} from '@shared/type_utils';

export const SpeedProdsColumn = {
  Start: 'start',
  End: 'end',
  AvgSpeed: 'avg_speed',
  PlanProdId: 'plan_prod_id',
};

export async function createSpeedProdsTable(db: knex): Promise<void> {
  const hasTable = await db.schema.hasTable(SPEED_PRODS_TABLE_NAME);
  if (!hasTable) {
    await db.schema.createTable(SPEED_PRODS_TABLE_NAME, table => {
      table
        .integer(SpeedProdsColumn.Start)
        .notNullable()
        .primary();
      table.integer(SpeedProdsColumn.End);
      table.integer(SpeedProdsColumn.AvgSpeed);
      table.integer(SpeedProdsColumn.PlanProdId);
    });
  }
}

// tslint:disable-next-line:no-any
function lineAsProd(lineData: any): Prod {
  const line = asMap(lineData);
  return {
    start: asNumber(line[SpeedProdsColumn.Start], 0),
    end: asNumber(line[SpeedProdsColumn.End], undefined),
    avgSpeed: asNumber(line[SpeedProdsColumn.AvgSpeed], undefined),
    planProdId: asNumber(line[SpeedProdsColumn.PlanProdId], undefined),
  };
}

export async function getLastProd(db: knex): Promise<Prod | undefined> {
  const res = asArray(
    await db(SPEED_PRODS_TABLE_NAME)
      .select()
      .orderBy(SpeedProdsColumn.Start, 'desc')
      .limit(1)
  );
  if (res.length === 0) {
    return undefined;
  }
  return lineAsProd(res[0]);
}

export async function getLastProdWithPlanProdId(db: knex): Promise<Prod | undefined> {
  const res = asArray(
    await db(SPEED_PRODS_TABLE_NAME)
      .select()
      .orderBy(SpeedProdsColumn.Start, 'desc')
      .whereNotNull(SpeedProdsColumn.PlanProdId)
      .limit(1)
  );
  if (res.length === 0) {
    return undefined;
  }
  return lineAsProd(res[0]);
}

export async function getRowCount(db: knex): Promise<number> {
  const countRes = await db(SPEED_PRODS_TABLE_NAME).count(`${SpeedProdsColumn.Start} as c`);
  return asNumber(asMap(asArray(countRes)[0])['c'], 0);
}

export async function hasProd(db: knex, start: number): Promise<boolean> {
  return (
    asNumber(
      asMap(
        asArray(
          await db(SPEED_PRODS_TABLE_NAME)
            .where(SpeedProdsColumn.Start, '=', start)
            .count(`${SpeedProdsColumn.Start} as c`)
        )[0]
      )['c'],
      0
    ) > 0
  );
}

export async function recordProdStart(db: knex, start: number, planProd?: number): Promise<void> {
  return db(SPEED_PRODS_TABLE_NAME).insert({
    [SpeedProdsColumn.Start]: start,
    [SpeedProdsColumn.PlanProdId]: planProd,
  });
}

export async function recordProdEnd(
  db: knex,
  start: number,
  end: number,
  avgSpeed: number
): Promise<void> {
  return db(SPEED_PRODS_TABLE_NAME)
    .where(SpeedProdsColumn.Start, '=', start)
    .update({
      [SpeedProdsColumn.End]: end,
      [SpeedProdsColumn.AvgSpeed]: avgSpeed,
    });
}

export async function getSpeedProdBetween(db: knex, start: number, end: number): Promise<Prod[]> {
  return db(SPEED_PRODS_TABLE_NAME)
    .select()
    .where(SpeedProdsColumn.Start, '>=', start)
    .andWhere(SpeedProdsColumn.Start, '<', end)
    .orWhere(function(): void {
      // tslint:disable-next-line:no-invalid-this
      this.where(SpeedProdsColumn.End, '>=', start).andWhere(SpeedProdsColumn.End, '<', end);
    })
    .map(lineAsProd);
}

export async function updateProdSpeed(db: knex, start: number, avgSpeed: number): Promise<void> {
  return db(SPEED_PRODS_TABLE_NAME)
    .where(SpeedProdsColumn.Start, '=', start)
    .update({
      [SpeedProdsColumn.AvgSpeed]: avgSpeed,
    });
}
