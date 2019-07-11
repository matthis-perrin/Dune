import knex from 'knex';

import {PLANS_PRODUCTION_TABLE_NAME} from '@shared/db/table_names';
import {PlanProductionRaw} from '@shared/models';
import {asMap, asNumber, asString, asArray, asBoolean} from '@shared/type_utils';

export const PlansProductionColumn = {
  ID_COLUMN: 'id',
  INDEX_COLUMN: 'index',
  START_TIME_COLUMN: 'start_time',
  END_TIME_COLUMN: 'end_time',
  STOP_TIME_COLUMN: 'stop_time',
  REPRISE_TIME_COLUMN: 'reprise_time',
  OPERATION_AT_START_OF_DAY: 'operation_at_start_of_day',
  PRODUCTION_AT_START_OF_DAY: 'production_at_start_of_day',
  DATA_COLUMN: 'data',
  SOMMEIL_COLUMN: 'sommeil',
  LOCAL_UPDATE_COLUMN: 'localUpdate',
};

export async function createPlansProductionTable(db: knex): Promise<void> {
  const hasTable = await db.schema.hasTable(PLANS_PRODUCTION_TABLE_NAME);
  if (!hasTable) {
    await db.schema.createTable(PLANS_PRODUCTION_TABLE_NAME, table => {
      table
        .integer(PlansProductionColumn.ID_COLUMN)
        .notNullable()
        .primary();
      table.integer(PlansProductionColumn.INDEX_COLUMN);
      table.integer(PlansProductionColumn.START_TIME_COLUMN);
      table.integer(PlansProductionColumn.END_TIME_COLUMN);
      table.integer(PlansProductionColumn.STOP_TIME_COLUMN);
      table.integer(PlansProductionColumn.REPRISE_TIME_COLUMN);
      table.boolean(PlansProductionColumn.OPERATION_AT_START_OF_DAY);
      table.boolean(PlansProductionColumn.PRODUCTION_AT_START_OF_DAY);
      table.text(PlansProductionColumn.DATA_COLUMN).notNullable();
      table.boolean(PlansProductionColumn.SOMMEIL_COLUMN).notNullable();
      table.dateTime(PlansProductionColumn.LOCAL_UPDATE_COLUMN).notNullable();
    });
  }
}

export async function createPlanProduction(
  db: knex,
  id: number,
  index: number,
  operationAtStartOfDay: boolean,
  productionAtStartOfDay: boolean,
  data: string
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    db.transaction(tx => {
      const indexesToUpdate = (query: knex.QueryBuilder) =>
        query.where(PlansProductionColumn.INDEX_COLUMN, '>=', index);
      updateIndexInDay(db, tx, indexesToUpdate, 1)
        .then(() => {
          db(PLANS_PRODUCTION_TABLE_NAME)
            .transacting(tx)
            .insert({
              [PlansProductionColumn.ID_COLUMN]: id,
              [PlansProductionColumn.INDEX_COLUMN]: index,
              [PlansProductionColumn.OPERATION_AT_START_OF_DAY]: operationAtStartOfDay,
              [PlansProductionColumn.PRODUCTION_AT_START_OF_DAY]: productionAtStartOfDay,
              [PlansProductionColumn.DATA_COLUMN]: data,
              [PlansProductionColumn.SOMMEIL_COLUMN]: false,
              [PlansProductionColumn.LOCAL_UPDATE_COLUMN]: new Date(),
            })
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

export async function updatePlanProductionData(db: knex, id: number, data: string): Promise<void> {
  db(PLANS_PRODUCTION_TABLE_NAME)
    .where(PlansProductionColumn.ID_COLUMN, id)
    .update({
      [PlansProductionColumn.DATA_COLUMN]: data,
      [PlansProductionColumn.LOCAL_UPDATE_COLUMN]: new Date(),
    });
}

export async function movePlanProduction(
  db: knex,
  id: number,
  fromIndex: number,
  toIndex: number,
  operationAtStartOfDay: boolean,
  productionAtStartOfDay: boolean
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    db.transaction(tx => {
      const isMovingForward = fromIndex < toIndex;
      const indexesToUpdate = (query: knex.QueryBuilder) =>
        query
          .where(PlansProductionColumn.INDEX_COLUMN, isMovingForward ? '>' : '<', fromIndex)
          .andWhere(PlansProductionColumn.INDEX_COLUMN, isMovingForward ? '<=' : '>=', toIndex);
      updateIndexInDay(db, tx, indexesToUpdate, isMovingForward ? -1 : 1)
        .then(() => {
          db(PLANS_PRODUCTION_TABLE_NAME)
            .transacting(tx)
            .where(PlansProductionColumn.ID_COLUMN, '=', id)
            .update({
              [PlansProductionColumn.INDEX_COLUMN]: toIndex,
              [PlansProductionColumn.OPERATION_AT_START_OF_DAY]: operationAtStartOfDay,
              [PlansProductionColumn.PRODUCTION_AT_START_OF_DAY]: productionAtStartOfDay,
              [PlansProductionColumn.LOCAL_UPDATE_COLUMN]: new Date(),
            })
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

export async function deletePlanProduction(db: knex, index: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    db.transaction(tx => {
      db(PLANS_PRODUCTION_TABLE_NAME)
        .transacting(tx)
        .where(PlansProductionColumn.INDEX_COLUMN, '=', index)
        .update({
          [PlansProductionColumn.SOMMEIL_COLUMN]: 1,
          // tslint:disable-next-line:no-null-keyword
          [PlansProductionColumn.INDEX_COLUMN]: null,
          [PlansProductionColumn.LOCAL_UPDATE_COLUMN]: Date.now(),
        })
        .then(() => {
          const indexesToUpdate = (query: knex.QueryBuilder) =>
            query.where(PlansProductionColumn.INDEX_COLUMN, '>', index);
          updateIndexInDay(db, tx, indexesToUpdate, -1)
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
  selector: (query: knex.QueryBuilder) => knex.QueryBuilder,
  offset: number
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const localUpdate = Date.now();
    selector(db(PLANS_PRODUCTION_TABLE_NAME).transacting(tx))
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
                [PlansProductionColumn.INDEX_COLUMN]:
                  asNumber(lineData[PlansProductionColumn.INDEX_COLUMN], 0) + offset,
                [PlansProductionColumn.LOCAL_UPDATE_COLUMN]: localUpdate,
              });
          })
        )
          // tslint:disable-next-line:no-unnecessary-callback-wrapper
          .then(() => resolve())
          .catch(reject);
      })
      .catch(reject);
  });
}

// tslint:disable-next-line:no-any
function mapLineToPlanProductionRaw(line: any): PlanProductionRaw {
  const r = asMap(line);
  return {
    id: asNumber(r[PlansProductionColumn.ID_COLUMN], 0),
    index: asNumber(r[PlansProductionColumn.INDEX_COLUMN], undefined),
    startTime: asNumber(r[PlansProductionColumn.START_TIME_COLUMN], undefined),
    endTime: asNumber(r[PlansProductionColumn.END_TIME_COLUMN], undefined),
    stopTime: asNumber(r[PlansProductionColumn.STOP_TIME_COLUMN], undefined),
    repriseTime: asNumber(r[PlansProductionColumn.REPRISE_TIME_COLUMN], undefined),
    operationAtStartOfDay: asBoolean(r[PlansProductionColumn.OPERATION_AT_START_OF_DAY]),
    productionAtStartOfDay: asBoolean(r[PlansProductionColumn.PRODUCTION_AT_START_OF_DAY]),
    data: asString(r[PlansProductionColumn.DATA_COLUMN], ''),
    sommeil: asNumber(r[PlansProductionColumn.SOMMEIL_COLUMN], 0) === 1,
    localUpdate: asNumber(r[PlansProductionColumn.LOCAL_UPDATE_COLUMN], 0),
  };
}

export async function listPlansProduction(
  db: knex,
  sinceLocalUpdate: number
): Promise<PlanProductionRaw[]> {
  return db(PLANS_PRODUCTION_TABLE_NAME)
    .select()
    .where(PlansProductionColumn.LOCAL_UPDATE_COLUMN, '>', new Date(sinceLocalUpdate))
    .map(mapLineToPlanProductionRaw);
}

export async function getNextPlanProductionId(db: knex): Promise<number> {
  const res = await db(PLANS_PRODUCTION_TABLE_NAME).max({id: PlansProductionColumn.ID_COLUMN});
  return asNumber(asMap(asArray(res)[0])['id'], 0) + 1;
}

export async function getClosestPlanProdBefore(
  db: knex,
  index: number
): Promise<PlanProductionRaw | undefined> {
  if (index > 0) {
    return (await db(PLANS_PRODUCTION_TABLE_NAME)
      .select()
      .where(PlansProductionColumn.INDEX_COLUMN, '=', index - 1)
      .map(mapLineToPlanProductionRaw))[0];
  }
  return (await db(PLANS_PRODUCTION_TABLE_NAME)
    .select()
    .orderBy(PlansProductionColumn.START_TIME_COLUMN, 'desc')
    .limit(1)
    .map(mapLineToPlanProductionRaw))[0];
}
