import knex from 'knex';

import {SPEED_STOPS_TABLE_NAME} from '@shared/db/table_names';
import {Stop, StopStatus} from '@shared/models';
import {asNumber, asMap, asArray, asString} from '@shared/type_utils';

export const SpeedStopsColumn = {
  Start: 'start',
  End: 'end',
  StopType: 'stop_type',
  StopInfo: 'stop_info',
  PlanProd: 'plan_prod',
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
      table.integer(SpeedStopsColumn.PlanProd);
    });
  }
}

// tslint:disable-next-line:no-any
function lineAsStop(lineData: any): Stop {
  const line = asMap(lineData);
  return {
    start: asNumber(line[SpeedStopsColumn.Start], 0),
    end: asNumber(line[SpeedStopsColumn.End], undefined),
    stopType: asString(line[SpeedStopsColumn.StopType], undefined),
    stopInfo: asString(line[SpeedStopsColumn.StopInfo], undefined),
    planProd: asNumber(line[SpeedStopsColumn.PlanProd], undefined),
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
