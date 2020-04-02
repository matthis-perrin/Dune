import knex from 'knex';

import {getLatestStopWithPlanIdBefore, SpeedStopsColumn} from '@shared/db/speed_stops';
import {PLANS_PRODUCTION_TABLE_NAME, SPEED_STOPS_TABLE_NAME} from '@shared/db/table_names';
import {PlanProductionRaw, PlanProductionInfo} from '@shared/models';
import {asMap, asNumber, asString, asArray, asBoolean} from '@shared/type_utils';

export const PlansProductionColumn = {
  ID_COLUMN: 'id',
  INDEX_COLUMN: 'index',
  OPERATION_AT_START_OF_DAY: 'operation_at_start_of_day',
  PRODUCTION_AT_START_OF_DAY: 'production_at_start_of_day',
  DATA_COLUMN: 'data',
  LOCAL_UPDATE_COLUMN: 'localUpdate',
};

// tslint:disable-next-line: no-any
type DebugFn = (...params: any[]) => void;

export async function createPlansProductionTable(db: knex): Promise<void> {
  const hasTable = await db.schema.hasTable(PLANS_PRODUCTION_TABLE_NAME);
  if (!hasTable) {
    await db.schema.createTable(PLANS_PRODUCTION_TABLE_NAME,table => {
      table.integer(PlansProductionColumn.ID_COLUMN).notNullable().primary();
      table.integer(PlansProductionColumn.INDEX_COLUMN).nullable();
      table.boolean(PlansProductionColumn.OPERATION_AT_START_OF_DAY).nullable();
      table.boolean(PlansProductionColumn.PRODUCTION_AT_START_OF_DAY).nullable();
      table.text(PlansProductionColumn.DATA_COLUMN).notNullable();
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
  data: string,
  debug: DebugFn
): Promise<void> {
  debug('createPlanProduction', id, index);
  return new Promise<void>((resolve, reject) => {
    db.transaction(tx => {
      const indexesToUpdate = (query: knex.QueryBuilder) =>
        query.where(PlansProductionColumn.INDEX_COLUMN, '>=', index);
      debug('updateIndexInDay');
      updateIndexInDay(db, tx, indexesToUpdate, 1, debug)
        .then(() => {
          debug('insert');
          db(PLANS_PRODUCTION_TABLE_NAME)
            .transacting(tx)
            .insert({
              [PlansProductionColumn.ID_COLUMN]: id,
              [PlansProductionColumn.INDEX_COLUMN]: index,
              [PlansProductionColumn.OPERATION_AT_START_OF_DAY]: operationAtStartOfDay,
              [PlansProductionColumn.PRODUCTION_AT_START_OF_DAY]: productionAtStartOfDay,
              [PlansProductionColumn.DATA_COLUMN]: data,
              [PlansProductionColumn.LOCAL_UPDATE_COLUMN]: new Date(),
            })
            .then(() => {
              debug('success');
              tx.commit();
              resolve();
            })
            .catch(err => {
              debug('error 2', err);
              tx.rollback();
              reject(err);
            });
        })
        .catch(err => {
          debug('error 1', err);
          tx.rollback();
          reject(err);
        });
    });
  });
}

export async function updatePlanProductionData(db: knex, id: number, data: string): Promise<void> {
  return db(PLANS_PRODUCTION_TABLE_NAME)
    .where(PlansProductionColumn.ID_COLUMN, id)
    .update({
      [PlansProductionColumn.DATA_COLUMN]: data,
      [PlansProductionColumn.LOCAL_UPDATE_COLUMN]: new Date(),
    });
}

export async function updatePlanProductionInfo(
  db: knex,
  id: number,
  info: PlanProductionInfo
): Promise<void> {
  return db(PLANS_PRODUCTION_TABLE_NAME)
    .where(PlansProductionColumn.ID_COLUMN, id)
    .update({
      [PlansProductionColumn.OPERATION_AT_START_OF_DAY]: info.operationAtStartOfDay,
      [PlansProductionColumn.PRODUCTION_AT_START_OF_DAY]: info.productionAtStartOfDay,
      [PlansProductionColumn.LOCAL_UPDATE_COLUMN]: new Date(),
    });
}

export async function movePlanProduction(
  db: knex,
  id: number,
  fromIndex: number,
  toIndex: number,
  debug: DebugFn
): Promise<void> {
  debug('movePlanProduction', id, fromIndex, toIndex);
  return new Promise<void>((resolve, reject) => {
    db.transaction(tx => {
      const isMovingForward = fromIndex < toIndex;
      const indexesToUpdate = (query: knex.QueryBuilder) =>
        query
          .where(PlansProductionColumn.INDEX_COLUMN, isMovingForward ? '>' : '<', fromIndex)
          .andWhere(PlansProductionColumn.INDEX_COLUMN, isMovingForward ? '<=' : '>=', toIndex);
      debug('updateIndexInDay');
      updateIndexInDay(db, tx, indexesToUpdate, isMovingForward ? -1 : 1, debug)
        .then(() => {
          debug('update');
          db(PLANS_PRODUCTION_TABLE_NAME)
            .transacting(tx)
            .where(PlansProductionColumn.ID_COLUMN, '=', id)
            .update({
              [PlansProductionColumn.INDEX_COLUMN]: toIndex,
              [PlansProductionColumn.LOCAL_UPDATE_COLUMN]: new Date(),
            })
            .then(() => {
              debug('success');
              tx.commit();
              resolve();
            })
            .catch(err => {
              debug('error 2', err);
              tx.rollback();
              reject(err);
            });
        })
        .catch(err => {
          debug('error 1', err);
          tx.rollback();
          reject(err);
        });
    });
  });
}

export async function deletePlanProduction(db: knex, index: number, debug: DebugFn): Promise<void> {
  debug('deletePlanProduction', index);
  return new Promise<void>((resolve, reject) => {
    db.transaction(tx => {
      debug('delete', index);
      db(PLANS_PRODUCTION_TABLE_NAME)
        .transacting(tx)
        .where(PlansProductionColumn.INDEX_COLUMN, '=', index)
        .del()
        .then(() => {
          const indexesToUpdate = (query: knex.QueryBuilder) =>
            query.where(PlansProductionColumn.INDEX_COLUMN, '>', index);
          debug('updateIndexInDay');
          updateIndexInDay(db, tx, indexesToUpdate, -1, debug)
            .then(() => {
              debug('success');
              tx.commit();
              resolve();
            })
            .catch(err => {
              debug('error 2', err);
              tx.rollback();
              reject(err);
            });
        })
        .catch(err => {
          debug('error 1', err);
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
  offset: number,
  debug: DebugFn
): Promise<void> {
  debug('updateIndexInDay', offset);
  return new Promise<void>((resolve, reject) => {
    const localUpdate = new Date();
    selector(db(PLANS_PRODUCTION_TABLE_NAME).transacting(tx))
      .then(data => {
        debug('select done', data);
        Promise.all(
          asArray(data).map(async line => {
            const lineData = asMap(line);
            debug(
              'update',
              lineData[PlansProductionColumn.ID_COLUMN],
              'to',
              asNumber(lineData[PlansProductionColumn.INDEX_COLUMN], 0) + offset
            );
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
          .then(() => {
            debug('success');
            resolve();
          })
          .catch(err => {
            debug('error 2', err);
            reject(err);
          });
      })
      .catch(err => {
        debug('error 1', err);
        reject(err);
      });
  });
}

// tslint:disable-next-line:no-any
function mapLineToPlanProductionRaw(line: any): PlanProductionRaw {
  const r = asMap(line);
  return {
    id: asNumber(r[PlansProductionColumn.ID_COLUMN], 0),
    index: asNumber(r[PlansProductionColumn.INDEX_COLUMN], 0),
    operationAtStartOfDay: asBoolean(r[PlansProductionColumn.OPERATION_AT_START_OF_DAY]),
    productionAtStartOfDay: asBoolean(r[PlansProductionColumn.PRODUCTION_AT_START_OF_DAY]),
    data: asString(r[PlansProductionColumn.DATA_COLUMN], ''),
    localUpdate: asNumber(r[PlansProductionColumn.LOCAL_UPDATE_COLUMN], 0),
  };
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
    return (
      await db(PLANS_PRODUCTION_TABLE_NAME)
        .select()
        .where(PlansProductionColumn.INDEX_COLUMN, '=', index - 1)
        .map(mapLineToPlanProductionRaw)
    )[0];
  }
  const latestStopWithPlanId = await getLatestStopWithPlanIdBefore(db, Date.now() * 2);
  if (!latestStopWithPlanId || !latestStopWithPlanId.planProdId) {
    return undefined;
  }
  return getPlanProd(db, latestStopWithPlanId.planProdId);
}

export async function getPlanProd(db: knex, id: number): Promise<PlanProductionRaw | undefined> {
  return (
    await db(PLANS_PRODUCTION_TABLE_NAME)
      .select()
      .where(PlansProductionColumn.ID_COLUMN, '=', id)
      .map(mapLineToPlanProductionRaw)
  )[0];
}

export async function getNotStartedPlanProds(db: knex): Promise<PlanProductionRaw[]> {
  return db
    .select()
    .from(PLANS_PRODUCTION_TABLE_NAME)
    .leftOuterJoin(
      SPEED_STOPS_TABLE_NAME,
      `${PLANS_PRODUCTION_TABLE_NAME}.${PlansProductionColumn.ID_COLUMN}`,
      `${SPEED_STOPS_TABLE_NAME}.${SpeedStopsColumn.PlanProdId}`
    )
    .whereNull(`${SPEED_STOPS_TABLE_NAME}.${SpeedStopsColumn.PlanProdId}`)
    .map(mapLineToPlanProductionRaw);
}

export async function getStartedPlanProdsInRange(
  db: knex,
  start: number,
  end: number,
  debug: DebugFn
): Promise<PlanProductionRaw[]> {
  const speedStartColumn = `${SPEED_STOPS_TABLE_NAME}.${SpeedStopsColumn.Start}`;
  const speedEndColumn = `${SPEED_STOPS_TABLE_NAME}.${SpeedStopsColumn.End}`;
  const speedPlanIdColumn = `${SPEED_STOPS_TABLE_NAME}.${SpeedStopsColumn.PlanProdId}`;

  return db
    .select()
    .from(PLANS_PRODUCTION_TABLE_NAME)
    .leftOuterJoin(
      SPEED_STOPS_TABLE_NAME,
      `${PLANS_PRODUCTION_TABLE_NAME}.${PlansProductionColumn.ID_COLUMN}`,
      speedPlanIdColumn
    )
    .whereNotNull(speedPlanIdColumn)
    .andWhere(function(): void {
      // tslint:disable:no-invalid-this
      this.where(speedStartColumn, '>=', start)
        .andWhere(speedStartColumn, '<', end)
        .orWhere(function(): void {
          this.where(speedEndColumn, '>=', start).andWhere(speedEndColumn, '<', end);
        });
      // tslint:enable:no-invalid-this
    })
    .groupBy(speedPlanIdColumn)
    .map(mapLineToPlanProductionRaw);
}
