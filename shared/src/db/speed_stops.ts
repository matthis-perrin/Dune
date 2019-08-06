import knex from 'knex';

import {getLastSpeedTime} from '@shared/db/speed_times';
import {SpeedProdsColumn} from '@shared/db/speed_prods';
import {SPEED_STOPS_TABLE_NAME, SPEED_PRODS_TABLE_NAME} from '@shared/db/table_names';
import {getNextProdStart} from '@shared/lib/time';
import {Stop, StopStatus, StopInfo, StopType, ProdRange} from '@shared/models';
import {asNumber, asMap, asArray, asString, asParsedJSON} from '@shared/type_utils';

export const SpeedStopsColumn = {
  Start: 'start',
  End: 'end',
  StopType: 'stop_type',
  StopInfo: 'stop_info',
  PlanProdId: 'plan_prod_id',
  MaintenanceId: 'maintenance_id',
};

export async function createSpeedStopsTable(db: knex): Promise<void> {
  const hasTable = await db.schema.hasTable(SPEED_STOPS_TABLE_NAME);
  if (!hasTable) {
    await db.schema.createTable(SPEED_STOPS_TABLE_NAME, table => {
      table
        .integer(SpeedStopsColumn.Start)
        .notNullable()
        .primary();
      table.integer(SpeedStopsColumn.End);
      table.text(SpeedStopsColumn.StopType);
      table.text(SpeedStopsColumn.StopInfo);
      table.integer(SpeedStopsColumn.PlanProdId);
      table.integer(SpeedStopsColumn.MaintenanceId);
    });
  }
}

// tslint:disable-next-line:no-any
function lineAsStop(lineData: any): Stop {
  const line = asMap(lineData);
  const stopInfoJSON = asString(line[SpeedStopsColumn.StopInfo], undefined);
  return {
    start: asNumber(line[SpeedStopsColumn.Start], 0),
    end: asNumber(line[SpeedStopsColumn.End], undefined),
    stopType: asString(line[SpeedStopsColumn.StopType], undefined) as StopType | undefined,
    stopInfo: stopInfoJSON === undefined ? undefined : asParsedJSON<StopInfo>(stopInfoJSON),
    planProdId: asNumber(line[SpeedStopsColumn.PlanProdId], undefined),
    maintenanceId: asNumber(line[SpeedStopsColumn.MaintenanceId], undefined),
  };
}

export async function getLastStop(db: knex): Promise<Stop | undefined> {
  const res = asArray(
    await db(SPEED_STOPS_TABLE_NAME)
      .select()
      .orderBy(SpeedStopsColumn.Start, 'desc')
      .limit(1)
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

export async function recordStopStart(db: knex, start: number, planProd?: number): Promise<void> {
  return db(SPEED_STOPS_TABLE_NAME).insert({
    [SpeedStopsColumn.Start]: start,
    [SpeedStopsColumn.PlanProdId]: planProd,
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
    .orWhere(function(): void {
      // tslint:disable-next-line:no-invalid-this
      this.where(SpeedStopsColumn.End, '>=', start).andWhere(SpeedStopsColumn.End, '<', end);
    })
    .map(lineAsStop);
}

// LOGIC AROUND UPDATING A STOP

async function getStop(db: knex, start: number): Promise<Stop | undefined> {
  const res = asArray(
    await db(SPEED_STOPS_TABLE_NAME)
      .select()
      .where(SpeedStopsColumn.Start, '=', start)
      .limit(1)
  );
  if (res.length === 0) {
    return undefined;
  }
  return lineAsStop(asArray(res)[0]);
}

const endOfDayTypes = [StopType.EndOfDayEndProd, StopType.EndOfDayPauseProd];

async function getNextEndOfProdStop(db: knex, start: number): Promise<Stop | undefined> {
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
  // Update all the stop and prods that happens after this stop until the next stop
  // that is an end of prod.
  const nextEndOfProdStop = await getNextEndOfProdStop(db, start);
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
  await Promise.all([
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
  prodRanges: Map<string, ProdRange>,
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
    [SpeedStopsColumn.PlanProdId]: newPlanId === undefined ? null : newPlanId,
    [SpeedStopsColumn.MaintenanceId]: maintenanceId === undefined ? null : maintenanceId,
  };

  const isEndOfDay = endOfDayTypes.indexOf(type) !== -1;
  const wasEndOfDay = endOfDayTypes.indexOf(type) !== -1;
  if (isEndOfDay) {
    // If we are dealing with an end of day stop there are two cases.
    // 1. It happened before prod hour -> we set the end time to the end of the prod hour
    // 2. It happened after prod hour -> we set the end time at the start time just to mark the stop
    const startDate = new Date(start);
    const dayOfWeek = startDate.toLocaleString('fr', {weekday: 'long'});
    const prodRange = prodRanges.get(dayOfWeek);
    const lastSpeedTime = await getLastSpeedTime(db);
    let stopEndTime = stop.end || (lastSpeedTime !== undefined ? lastSpeedTime.time : start);
    if (prodRange) {
      const prodHourEnd = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
        prodRange.endHour,
        prodRange.endMinute
      );
      if (stopEndTime < prodHourEnd.getTime()) {
        stopEndTime = prodHourEnd.getTime();
      }
    }
    fields[SpeedStopsColumn.End] = stopEndTime;
    // In both cases we create an additional stop from the end time we've just set to the next prod start,
    // unless this has already be done
    const nextStop = await getStop(db, stopEndTime);
    if (nextStop === undefined) {
      const nextProdStart = getNextProdStart(stopEndTime, prodRanges);
      await db(SPEED_STOPS_TABLE_NAME).insert({
        [SpeedStopsColumn.Start]: stopEndTime,
        [SpeedStopsColumn.End]: nextProdStart,
        [SpeedStopsColumn.StopType]: StopType.NotProdHours,
      });
    }
  } else if (wasEndOfDay) {
    // If we are transitionning from a end of day stop to a non end of day, we need to rollback
    // the stops that we had created when the end of day stop was originally registered.
    // In theory the last stop in DB should be a "not prod hour" stop.
    // In that case, we just delete it and reset the end time on the end of day stop.
    // Otherwise, we can't do much beside simply updating the event, as more stops and prods
    // have been built on top of it.
    const lastStop = await getLastStop(db);
    if (lastStop && lastStop.stopType === StopType.NotProdHours && lastStop.start === stop.end) {
      await db(SPEED_STOPS_TABLE_NAME)
        .where(SpeedStopsColumn.Start, '=', stop.end)
        .del();
      fields[SpeedStopsColumn.End] = null;
    }
  }

  await db(SPEED_STOPS_TABLE_NAME)
    .where(SpeedStopsColumn.Start, '=', start)
    .update(fields);
}

export async function createStop(db: knex, stopStart: number, stopEnd: number): Promise<void> {
  const stop = await getStop(db, stopStart);
  if (stop === undefined) {
    throw new Error(`Can not create stop. Stop with start time ${stopStart} does not exist.`);
  }
  if (stop.end !== undefined) {
    throw new Error(`Can not create stop. Stop with start time ${stopStart} is not in progress.`);
  }

  return new Promise<void>((resolve, reject) => {
    db.transaction(tx =>
      tx(SPEED_STOPS_TABLE_NAME)
        .where(SpeedStopsColumn.Start, '=', stopStart)
        .update({
          [SpeedStopsColumn.End]: stopEnd,
        })
        .then(() =>
          tx(SPEED_STOPS_TABLE_NAME).insert({
            [SpeedStopsColumn.Start]: stopEnd,
            [SpeedStopsColumn.PlanProdId]: stop.planProdId,
            [SpeedStopsColumn.MaintenanceId]: stop.maintenanceId,
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

export async function mergeStops(
  db: knex,
  start1: number,
  start2: number,
  mergedInfo: StopInfo,
  newEnd: number | undefined
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    db.transaction(tx =>
      tx(SPEED_STOPS_TABLE_NAME)
        .where(SpeedStopsColumn.Start, start2)
        .del()
        .then(() =>
          tx(SPEED_STOPS_TABLE_NAME)
            .where(SpeedStopsColumn.Start, start1)
            .update({
              [SpeedStopsColumn.End]: newEnd === undefined ? null : newEnd,
              [SpeedStopsColumn.StopInfo]: JSON.stringify(mergedInfo),
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
