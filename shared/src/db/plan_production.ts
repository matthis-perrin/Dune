import knex from 'knex';

import {PLANS_PRODUCTION_TABLE_NAME, SQLITE_SEQUENCE} from '@shared/db/table_names';
import {PlanProductionRaw, PlanProductionInfo} from '@shared/models';
import {asMap, asNumber, asString, asArray} from '@shared/type_utils';

export const PlansProductionColumn = {
  ID_COLUMN: 'id',
  YEAR_COLUMN: 'year',
  MONTH_COLUMN: 'month',
  DAY_COLUMN: 'day',
  INDEX_IN_DAY_COLUMN: 'index_in_day',
  DATA_COLUMN: 'data',
  SOMMEIL_COLUMN: 'sommeil',
  LOCAL_UPDATE_COLUMN: 'localUpdate',
};

export async function createPlansProductionTable(db: knex): Promise<void> {
  const hasTable = await db.schema.hasTable(PLANS_PRODUCTION_TABLE_NAME);
  if (!hasTable) {
    await db.schema.createTable(PLANS_PRODUCTION_TABLE_NAME, table => {
      table
        .increments(PlansProductionColumn.ID_COLUMN)
        .notNullable()
        .primary();
      table.integer(PlansProductionColumn.YEAR_COLUMN).notNullable();
      table.integer(PlansProductionColumn.MONTH_COLUMN).notNullable();
      table.integer(PlansProductionColumn.DAY_COLUMN).notNullable();
      table.integer(PlansProductionColumn.INDEX_IN_DAY_COLUMN).notNullable();
      table.text(PlansProductionColumn.DATA_COLUMN).notNullable();
      table.boolean(PlansProductionColumn.SOMMEIL_COLUMN);
      table.dateTime(PlansProductionColumn.LOCAL_UPDATE_COLUMN);
    });
  }
}

export async function savePlanProduction(
  db: knex,
  id: number | undefined,
  info: PlanProductionInfo,
  data: string
): Promise<void> {
  const localUpdate = new Date();
  const fields = {
    [PlansProductionColumn.YEAR_COLUMN]: info.year,
    [PlansProductionColumn.MONTH_COLUMN]: info.month,
    [PlansProductionColumn.DAY_COLUMN]: info.day,
    [PlansProductionColumn.INDEX_IN_DAY_COLUMN]: info.indexInDay,
    [PlansProductionColumn.DATA_COLUMN]: data,
    [PlansProductionColumn.LOCAL_UPDATE_COLUMN]: localUpdate,
  };

  const insertOrUpdate = (query: knex.QueryBuilder): knex.QueryBuilder => {
    if (id === undefined) {
      // tslint:disable-next-line:no-null-keyword
      return query.insert({id: null, sommeil: false, ...fields});
    } else {
      return query.where(PlansProductionColumn.ID_COLUMN, id).update(fields);
    }
  };

  return new Promise<void>((resolve, reject) => {
    db.transaction(tx => {
      updateIndexInDay(db, tx, info, '>=', 1)
        .then(() => {
          insertOrUpdate(db(PLANS_PRODUCTION_TABLE_NAME).transacting(tx))
            .then(() => {
              tx.commit();
              resolve();
            })
            .catch(err => {
              tx.rollback();
              reject(err);
            });
        })
        .catch(err => {
          tx.rollback();
          reject(err);
        });
    });
  });
}

export async function deletePlanProduction(db: knex, info: PlanProductionInfo): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    db.transaction(tx => {
      db(PLANS_PRODUCTION_TABLE_NAME)
        .transacting(tx)
        .where(PlansProductionColumn.YEAR_COLUMN, '=', info.year)
        .andWhere(PlansProductionColumn.MONTH_COLUMN, '=', info.month)
        .andWhere(PlansProductionColumn.DAY_COLUMN, '=', info.day)
        .andWhere(PlansProductionColumn.INDEX_IN_DAY_COLUMN, '=', info.indexInDay)
        .update({
          [PlansProductionColumn.SOMMEIL_COLUMN]: 1,
          [PlansProductionColumn.INDEX_IN_DAY_COLUMN]: -1,
          [PlansProductionColumn.LOCAL_UPDATE_COLUMN]: Date.now(),
        })
        .then(() => {
          updateIndexInDay(db, tx, info, '>', -1)
            .then(() => {
              tx.commit();
              resolve();
            })
            .catch(err => {
              tx.rollback();
              reject(err);
            });
        })
        .catch(err => {
          tx.rollback();
          reject(err);
        });
    });
  });
}

async function updateIndexInDay(
  db: knex,
  tx: knex.Transaction,
  info: PlanProductionInfo,
  indexInDayOperator: string,
  offset: number
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const localUpdate = Date.now();
    db(PLANS_PRODUCTION_TABLE_NAME)
      .transacting(tx)
      .where(PlansProductionColumn.YEAR_COLUMN, '=', info.year)
      .andWhere(PlansProductionColumn.MONTH_COLUMN, '=', info.month)
      .andWhere(PlansProductionColumn.DAY_COLUMN, '=', info.day)
      .andWhere(PlansProductionColumn.INDEX_IN_DAY_COLUMN, indexInDayOperator, info.indexInDay)
      .then(data => {
        Promise.all(
          asArray(data).map(async line => {
            const lineData = asMap(line);
            await db(PLANS_PRODUCTION_TABLE_NAME)
              .transacting(tx)
              .where(
                PlansProductionColumn.ID_COLUMN,
                '=',
                asNumber(lineData[PlansProductionColumn.ID_COLUMN], 0)
              )
              .update({
                [PlansProductionColumn.INDEX_IN_DAY_COLUMN]:
                  asNumber(lineData[PlansProductionColumn.INDEX_IN_DAY_COLUMN], 0) + offset,
                [PlansProductionColumn.LOCAL_UPDATE_COLUMN]: localUpdate,
              });
          })
        )
          .then(() => resolve())
          .catch(reject);
      })
      .catch(reject);
  });
}

export async function listPlansProduction(
  db: knex,
  sinceLocalUpdate: number
): Promise<PlanProductionRaw[]> {
  return db(PLANS_PRODUCTION_TABLE_NAME)
    .select()
    .where(PlansProductionColumn.LOCAL_UPDATE_COLUMN, '>', new Date(sinceLocalUpdate))
    .map(planProductionLine => {
      const r = asMap(planProductionLine);
      return {
        id: asNumber(r[PlansProductionColumn.ID_COLUMN], 0),
        year: asNumber(r[PlansProductionColumn.YEAR_COLUMN], 0),
        month: asNumber(r[PlansProductionColumn.MONTH_COLUMN], 0),
        day: asNumber(r[PlansProductionColumn.DAY_COLUMN], 0),
        indexInDay: asNumber(r[PlansProductionColumn.INDEX_IN_DAY_COLUMN], 0),
        data: asString(r[PlansProductionColumn.DATA_COLUMN], ''),
        sommeil: asNumber(r[PlansProductionColumn.SOMMEIL_COLUMN], 0) === 1,
        localUpdate: asNumber(r[PlansProductionColumn.LOCAL_UPDATE_COLUMN], 0),
      };
    });
}

export async function getNextPlanProductionId(db: knex): Promise<number> {
  const res = await db(SQLITE_SEQUENCE)
    .select('seq')
    .where('name', '=', PLANS_PRODUCTION_TABLE_NAME);
  return asNumber(asMap(asArray(res)[0])['seq'], 0) + 1;
}
