import knex from 'knex';

import {SPEED_STOPS_TABLE_NAME, SPEED_PRODS_TABLE_NAME} from '@shared/db/table_names';
import {Stop, StopStatus, StopInfo, StopType, ProdRange} from '@shared/models';
import {asNumber, asMap, asArray, asString, asParsedJSON} from '@shared/type_utils';
import {SpeedProdsColumn} from '@shared/db/speed_prods';
import {getNextProdStart} from '@shared/lib/time';

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
    stopType: asString(line[SpeedStopsColumn.StopType], undefined),
    stopInfo: stopInfoJSON === undefined ? undefined : asParsedJSON<StopInfo>(stopInfoJSON),
    planProdId: asNumber(line[SpeedStopsColumn.PlanProdId], undefined),
    maintenanceId: asNumber(line[SpeedStopsColumn.MaintenanceId], undefined),
  };
}

export async function getLastStop(db: knex): Promise<Stop | undefined> {
  const res = await db(SPEED_STOPS_TABLE_NAME)
    .select()
    .orderBy(SpeedStopsColumn.Start, 'desc')
    .limit(1);
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

export async function recordStopStart(db: knex, start: number): Promise<void> {
  return db(SPEED_STOPS_TABLE_NAME).insert({
    [SpeedStopsColumn.Start]: start,
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
    .orWhere(function() {
      this.where(SpeedStopsColumn.End, '>=', start).andWhere(SpeedStopsColumn.End, '<', end);
    })
    .map(lineAsStop);
}

// LOGIC AROUND UPDATING A STOP

async function getStop(db: knex, start: number): Promise<Stop | undefined> {
  const res = await db(SPEED_STOPS_TABLE_NAME)
    .select()
    .where(SpeedStopsColumn.Start, '=', start)
    .limit(1);
  if (res.length === 0) {
    return undefined;
  }
  return lineAsStop(asArray(res)[0]);
}

const endOfProdTypes = [StopType.ChangePlanProd, StopType.EndOfDayEndProd];
const endOfDayTypes = [StopType.EndOfDayEndProd, StopType.EndOfDayPauseProd];

async function getNextEndOfProdStop(db: knex, start: number): Promise<Stop | undefined> {
  const res = await db(SPEED_STOPS_TABLE_NAME)
    .select()
    .whereIn(SpeedStopsColumn.StopType, endOfProdTypes)
    .andWhere(SpeedStopsColumn.Start, '>', start)
    .orderBy(SpeedStopsColumn.Start)
    .limit(1);
  if (res.length === 0) {
    return undefined;
  }
  return lineAsStop(asArray(res)[0]);
}

export async function getLatestStopWithPlanIdBefore(
  db: knex,
  start: number
): Promise<Stop | undefined> {
  const res = await db(SPEED_STOPS_TABLE_NAME)
    .select()
    .whereNotNull(SpeedStopsColumn.PlanProdId)
    .andWhere(SpeedStopsColumn.Start, '<', start)
    .orderBy(SpeedStopsColumn.Start, 'desc')
    .limit(1);
  if (res.length === 0) {
    return undefined;
  }
  return lineAsStop(asArray(res)[0]);
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

  let newPlanId = planProdId || stop.planProdId;

  const isProdEnd = endOfProdTypes.indexOf(type) !== -1;
  if (isProdEnd) {
    if (planProdId === undefined) {
      throw new Error(`Can't mark a stop as ${type} without a plan id`);
    }
    // Update all the stop and prods that happens after this stop until the next stop
    // that is an end of prod.
    const nextEndOfProdStop = await getNextEndOfProdStop(db, start);
    const stopsUpdateQuery = db(SPEED_STOPS_TABLE_NAME).where(SpeedStopsColumn.Start, '>', start);
    const prodsUpdateQuery = db(SPEED_PRODS_TABLE_NAME).where(SpeedProdsColumn.Start, '>', start);
    if (nextEndOfProdStop) {
      stopsUpdateQuery
        .andWhere(SpeedStopsColumn.Start, '<', nextEndOfProdStop.start)
        .andWhereNot(SpeedStopsColumn.StopType, StopType.NotProdHours);
      prodsUpdateQuery
        .andWhere(SpeedProdsColumn.Start, '<', nextEndOfProdStop.start)
        .andWhereNot(SpeedStopsColumn.StopType, StopType.NotProdHours);
    }
    stopsUpdateQuery.update({
      [SpeedStopsColumn.PlanProdId]: planProdId,
    });
    prodsUpdateQuery.update({
      [SpeedProdsColumn.PlanProdId]: planProdId,
    });
  } else {
    if (!newPlanId) {
      const previousStopWithPlanId = await getLatestStopWithPlanIdBefore(db, start);
      if (previousStopWithPlanId !== undefined) {
        newPlanId = previousStopWithPlanId.planProdId;
      }
    }
  }

  const fields = {
    [SpeedStopsColumn.StopType]: type,
    [SpeedStopsColumn.StopInfo]: JSON.stringify(info),
    [SpeedStopsColumn.PlanProdId]: newPlanId,
    [SpeedStopsColumn.MaintenanceId]: maintenanceId,
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
    let stopEndTime = start;
    if (prodRange) {
      const prodHourEnd = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
        prodRange.endHour,
        prodRange.startHour
      );
      if (start < prodHourEnd.getTime()) {
        stopEndTime = prodHourEnd.getTime();
      }
    }
    fields[SpeedStopsColumn.End] = stopEndTime;
    // In both cases we create an additional stop from the end time we've just set to the next prod start
    const nextProdStart = getNextProdStart(stopEndTime, prodRanges);
    await db(SPEED_STOPS_TABLE_NAME).insert({
      [SpeedStopsColumn.Start]: stopEndTime,
      [SpeedStopsColumn.End]: nextProdStart,
      [SpeedStopsColumn.StopType]: StopType.NotProdHours,
    });
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
      fields[SpeedStopsColumn.End] = undefined;
    }
  }

  await db(SPEED_STOPS_TABLE_NAME)
    .where(SpeedStopsColumn.Start, '=', start)
    .update(fields);
}
