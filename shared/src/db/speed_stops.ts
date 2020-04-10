import knex from 'knex';

import {SpeedProdsColumn} from '@shared/db/speed_prods';
import {getLastSpeedTime} from '@shared/db/speed_times';
import {SPEED_STOPS_TABLE_NAME, SPEED_PRODS_TABLE_NAME} from '@shared/db/table_names';
import {Stop, StopStatus, StopInfo, StopType} from '@shared/models';
import {asNumber, asMap, asArray, asString, asParsedJSON} from '@shared/type_utils';
import {AllPromise} from '@shared/promise_utils';

export const SpeedStopsColumn = {
  Start: 'start',
  End: 'end',
  StopType: 'stop_type',
  StopInfo: 'stop_info',
  PlanProdId: 'plan_prod_id',
  MaintenanceId: 'maintenance_id',
  Title: 'title',
};

export async function createSpeedStopsTable(db: knex): Promise<void> {
  const hasTable = await db.schema.hasTable(SPEED_STOPS_TABLE_NAME);
  if (!hasTable) {
    await db.schema.createTable(SPEED_STOPS_TABLE_NAME, table => {
      table.bigInteger(SpeedStopsColumn.Start).notNullable().primary();
      table.bigInteger(SpeedStopsColumn.End).nullable();
      table.text(SpeedStopsColumn.StopType).nullable();
      table.text(SpeedStopsColumn.StopInfo).nullable();
      table.integer(SpeedStopsColumn.PlanProdId).nullable();
      table.integer(SpeedStopsColumn.MaintenanceId).nullable();
      table.text(SpeedStopsColumn.Title).nullable();
    });
  }
}

// tslint:disable-next-line:no-any
export function lineAsStop(lineData: any): Stop {
  const line = asMap(lineData);
  const stopInfoJSON = asString(line[SpeedStopsColumn.StopInfo], undefined);
  return {
    start: asNumber(line[SpeedStopsColumn.Start], 0),
    end: asNumber(line[SpeedStopsColumn.End], undefined),
    stopType: asString(line[SpeedStopsColumn.StopType], undefined) as StopType | undefined,
    stopInfo: stopInfoJSON === undefined ? undefined : asParsedJSON<StopInfo>(stopInfoJSON),
    planProdId: asNumber(line[SpeedStopsColumn.PlanProdId], undefined),
    maintenanceId: asNumber(line[SpeedStopsColumn.MaintenanceId], undefined),
    title: asString(line[SpeedStopsColumn.Title], undefined),
  };
}

export async function getLastStop(db: knex): Promise<Stop | undefined> {
  const res = asArray(
    await db(SPEED_STOPS_TABLE_NAME).select().orderBy(SpeedStopsColumn.Start, 'desc').limit(1)
  );
  if (res.length === 0) {
    return undefined;
  }
  return lineAsStop(res[0]);
}

export async function getLastStopWithPlanProdId(db: knex): Promise<Stop | undefined> {
  const res = asArray(
    await db(SPEED_STOPS_TABLE_NAME)
      .select()
      .orderBy(SpeedStopsColumn.Start, 'desc')
      .whereNotNull(SpeedStopsColumn.PlanProdId)
      .limit(1)
  );
  if (res.length === 0) {
    return undefined;
  }
  return lineAsStop(res[0]);
}

export async function getRowCount(db: knex): Promise<number> {
  const countRes = await db(SPEED_STOPS_TABLE_NAME).count(`${SpeedStopsColumn.Start} as c`);
  return asNumber(asMap(asArray(countRes)[0])['c'], 0);
}

export async function getStats(db: knex): Promise<StopStatus> {
  const lastStop = await getLastStop(db);
  return {lastStop};
}

export async function hasStop(db: knex, start: number): Promise<boolean> {
  return (
    asNumber(
      asMap(
        asArray(
          await db(SPEED_STOPS_TABLE_NAME)
            .where(SpeedStopsColumn.Start, '=', start)
            .count(`${SpeedStopsColumn.Start} as c`)
        )[0]
      )['c'],
      0
    ) > 0
  );
}

export async function insertOrUpdateStop(db: knex, start: number, end?: number): Promise<void> {
  const shouldUpdate = await hasStop(db, start);
  if (shouldUpdate) {
    return db(SPEED_STOPS_TABLE_NAME)
      .where(SpeedStopsColumn.Start, '=', start)
      .update({
        [SpeedStopsColumn.End]: end,
      });
  } else {
    return db(SPEED_STOPS_TABLE_NAME).insert({
      [SpeedStopsColumn.Start]: start,
      [SpeedStopsColumn.End]: end,
    });
  }
}

export async function recordStopStart(
  db: knex,
  start: number,
  planProdId: number | undefined,
  stopType?: StopType,
  stopTitle?: string
): Promise<void> {
  return db(SPEED_STOPS_TABLE_NAME).insert({
    [SpeedStopsColumn.Start]: start,
    [SpeedStopsColumn.PlanProdId]: planProdId,
    [SpeedStopsColumn.StopType]: stopType,
    [SpeedStopsColumn.Title]: stopTitle,
  });
}

export async function recordStopEnd(db: knex, start: number, end: number): Promise<void> {
  return db(SPEED_STOPS_TABLE_NAME)
    .where(SpeedStopsColumn.Start, '=', start)
    .update({
      [SpeedStopsColumn.End]: end,
    });
}

export async function getSpeedStopBetween(db: knex, start: number, end: number): Promise<Stop[]> {
  return db(SPEED_STOPS_TABLE_NAME)
    .select()
    .where(SpeedStopsColumn.Start, '>=', start)
    .andWhere(SpeedStopsColumn.Start, '<', end)
    .orWhere(function (): void {
      // tslint:disable-next-line:no-invalid-this
      this.where(SpeedStopsColumn.End, '>=', start).andWhere(SpeedStopsColumn.End, '<', end);
    })
    .map(lineAsStop);
}

export async function getLastPlanProdChangeBefore(
  db: knex,
  start: number
): Promise<Stop | undefined> {
  const query = db(SPEED_STOPS_TABLE_NAME)
    .select()
    .where(SpeedStopsColumn.StopType, '=', StopType.ChangePlanProd)
    .andWhere(SpeedStopsColumn.Start, '<=', start)
    .orderBy(SpeedStopsColumn.Start, 'desc')
    .limit(1);
  const res = asArray(await query);
  if (res.length === 0) {
    return undefined;
  }
  return lineAsStop(asArray(res)[0]);
}

// LOGIC AROUND UPDATING A STOP

async function getStop(db: knex, start: number): Promise<Stop | undefined> {
  const res = asArray(
    await db(SPEED_STOPS_TABLE_NAME).select().where(SpeedStopsColumn.Start, '=', start).limit(1)
  );
  if (res.length === 0) {
    return undefined;
  }
  return lineAsStop(asArray(res)[0]);
}

async function getNextChangePlanProdStop(db: knex, start: number): Promise<Stop | undefined> {
  const res = asArray(
    await db(SPEED_STOPS_TABLE_NAME)
      .select()
      .where(SpeedStopsColumn.StopType, '=', StopType.ChangePlanProd)
      .andWhere(SpeedStopsColumn.Start, '>', start)
      .orderBy(SpeedStopsColumn.Start)
      .limit(1)
  );
  if (res.length === 0) {
    return undefined;
  }
  return lineAsStop(asArray(res)[0]);
}

export async function getLatestStopWithPlanIdBefore(
  db: knex,
  start: number
): Promise<Stop | undefined> {
  const res = asArray(
    await db(SPEED_STOPS_TABLE_NAME)
      .select()
      .whereNotNull(SpeedStopsColumn.PlanProdId)
      .andWhere(SpeedStopsColumn.Start, '<', start)
      .orderBy(SpeedStopsColumn.Start, 'desc')
      .limit(1)
  );
  if (res.length === 0) {
    return undefined;
  }
  return lineAsStop(asArray(res)[0]);
}

export async function updateFollowingEventsOfPlanProd(
  db: knex,
  start: number,
  newPlanId: number
): Promise<void> {
  // Update all the stop and prods that happens after this stop until the next plan prod
  const nextEndOfProdStop = await getNextChangePlanProdStop(db, start);
  const stopsUpdateQuery = db(SPEED_STOPS_TABLE_NAME).where(SpeedStopsColumn.Start, '>=', start);
  const prodsUpdateQuery = db(SPEED_PRODS_TABLE_NAME).where(SpeedProdsColumn.Start, '>=', start);
  if (nextEndOfProdStop) {
    stopsUpdateQuery
      .andWhere(SpeedStopsColumn.Start, '<', nextEndOfProdStop.start)
      .andWhereNot(SpeedStopsColumn.StopType, StopType.NotProdHours);
    prodsUpdateQuery
      .andWhere(SpeedProdsColumn.Start, '<', nextEndOfProdStop.start)
      .andWhereNot(SpeedStopsColumn.StopType, StopType.NotProdHours);
  }
  await AllPromise([
    stopsUpdateQuery.update({
      [SpeedStopsColumn.PlanProdId]: newPlanId,
    }),
    prodsUpdateQuery.update({
      [SpeedProdsColumn.PlanProdId]: newPlanId,
    }),
  ]);
}

export async function updateStopInfo(
  db: knex,
  start: number,
  type: StopType,
  info: StopInfo,
  planProdId: number | undefined,
  maintenanceId: number | undefined
): Promise<void> {
  const stop = await getStop(db, start);
  if (stop === undefined) {
    throw new Error(`Stop with start time ${start} does not exist`);
  }
  // Compute what the stop plan id should be
  let newPlanId: number | undefined;
  if (type === StopType.ChangePlanProd) {
    if (planProdId === undefined) {
      throw new Error(`Can't mark a stop as ${type} without a plan id`);
    } else {
      newPlanId = planProdId;
    }
  } else {
    const previousStopWithPlanId = await getLatestStopWithPlanIdBefore(db, start);
    if (previousStopWithPlanId !== undefined) {
      newPlanId = previousStopWithPlanId.planProdId;
    }
  }

  // When we are transitionning from a ChangePlanProd to a non ChangePlanProd, we need to update
  // the plan id of the following events to be the plan of the previous plan id
  if (stop.stopType === StopType.ChangePlanProd && type !== StopType.ChangePlanProd) {
    if (newPlanId !== undefined) {
      await updateFollowingEventsOfPlanProd(db, start, newPlanId);
    }
  }

  // When we are transitionning to a ChangePlanProd, we need to update the plan id of the following events to
  // be the new plan id
  if (type === StopType.ChangePlanProd) {
    if (newPlanId !== undefined) {
      await updateFollowingEventsOfPlanProd(db, start, newPlanId);
    }
  }

  const fields = {
    [SpeedStopsColumn.StopType]: type,
    [SpeedStopsColumn.StopInfo]: JSON.stringify(info),
    // tslint:disable-next-line:no-null-keyword
    [SpeedStopsColumn.PlanProdId]: newPlanId === undefined ? null : newPlanId,
    // tslint:disable-next-line:no-null-keyword
    [SpeedStopsColumn.MaintenanceId]: maintenanceId === undefined ? null : maintenanceId,
  };

  await db(SPEED_STOPS_TABLE_NAME).where(SpeedStopsColumn.Start, '=', start).update(fields);
}

// ----------------------------
// Maintenance stop interaction
// ----------------------------

export async function getMaintenanceStop(
  db: knex,
  maintenanceId: number
): Promise<Stop | undefined> {
  const res = asArray(
    await db(SPEED_STOPS_TABLE_NAME)
      .select()
      .whereNull(SpeedStopsColumn.End)
      .andWhere(SpeedStopsColumn.StopType, '=', StopType.Maintenance)
      .andWhere(SpeedStopsColumn.MaintenanceId, '=', maintenanceId)
      .limit(1)
  );
  if (res.length === 0) {
    return undefined;
  }
  return lineAsStop(res[0]);
}

export async function startMaintenanceStop(db: knex, maintenanceId: number): Promise<void> {
  const [lastStop, lastSpeed] = await AllPromise([getLastStop(db), getLastSpeedTime(db, true)]);
  if (!lastStop || lastStop.end !== undefined) {
    throw new Error('No stop in progress');
  }

  return new Promise<void>((resolve, reject) => {
    const end = lastSpeed ? lastSpeed.time : Date.now();
    db.transaction(tx =>
      tx(SPEED_STOPS_TABLE_NAME)
        .whereNull(SpeedStopsColumn.End)
        .andWhere(SpeedStopsColumn.Start, '=', lastStop.start)
        .update({
          [SpeedStopsColumn.End]: end,
        })
        .then(() =>
          tx(SPEED_STOPS_TABLE_NAME).insert({
            [SpeedStopsColumn.Start]: end,
            [SpeedStopsColumn.StopType]: StopType.Maintenance,
            [SpeedStopsColumn.PlanProdId]: lastStop.planProdId,
            [SpeedStopsColumn.MaintenanceId]: maintenanceId,
          })
        )
        .then(() => {
          tx.commit();
          resolve();
        })
        .catch(err => {
          tx.rollback();
          reject(err);
        })
    );
  });
}

export async function deleteMaintenanceStop(db: knex, maintenanceId: number): Promise<void> {
  const maintenanceStop = await getMaintenanceStop(db, maintenanceId);
  if (!maintenanceStop) {
    throw new Error(`No maintenance in progress with the id ${maintenanceId}`);
  }

  return new Promise<void>((resolve, reject) => {
    db.transaction(tx =>
      tx(SPEED_STOPS_TABLE_NAME)
        .whereNull(SpeedStopsColumn.End)
        .andWhere(SpeedStopsColumn.StopType, '=', StopType.Maintenance)
        .andWhere(SpeedStopsColumn.MaintenanceId, '=', maintenanceId)
        .del()
        .then(() =>
          tx(SPEED_STOPS_TABLE_NAME)
            .where(SpeedStopsColumn.End, maintenanceStop.start)
            .update({
              // tslint:disable-next-line:no-null-keyword
              [SpeedStopsColumn.End]: null,
            })
        )
        .then(() => {
          tx.commit();
          resolve();
        })
        .catch(err => {
          tx.rollback();
          reject(err);
        })
    );
  });
}

export async function endMaintenanceStop(db: knex, maintenanceId: number): Promise<void> {
  const [maintenanceStop, lastSpeed] = await AllPromise([
    getMaintenanceStop(db, maintenanceId),
    getLastSpeedTime(db, true),
  ]);
  if (!maintenanceStop) {
    throw new Error(`No maintenance in progress with the id ${maintenanceId}`);
  }

  return new Promise<void>((resolve, reject) => {
    const end = lastSpeed ? lastSpeed.time : Date.now();
    db.transaction(tx =>
      tx(SPEED_STOPS_TABLE_NAME)
        .whereNull(SpeedStopsColumn.End)
        .andWhere(SpeedStopsColumn.StopType, '=', StopType.Maintenance)
        .andWhere(SpeedStopsColumn.MaintenanceId, '=', maintenanceId)
        .update({
          [SpeedStopsColumn.End]: end,
        })
        .then(() =>
          tx(SPEED_STOPS_TABLE_NAME).insert({
            [SpeedStopsColumn.Start]: end,
            [SpeedStopsColumn.PlanProdId]: maintenanceStop.planProdId,
          })
        )
        .then(() => {
          tx.commit();
          resolve();
        })
        .catch(err => {
          console.log(err);
          tx.rollback();
          reject(err);
        })
    );
  });
}
