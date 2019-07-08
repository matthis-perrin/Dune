import knex from 'knex';

import {PLANS_PRODUCTION_TABLE_NAME} from '@shared/db/table_names';
import {PlanProductionRaw} from '@shared/models';
import {asMap, asNumber, asString} from '@shared/type_utils';

export const PlansProductionColumn = {
  ID_COLUMN: 'id',
  DATA: 'data',
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
      table.text(PlansProductionColumn.DATA).notNullable();
      table.boolean(PlansProductionColumn.SOMMEIL_COLUMN);
      table.dateTime(PlansProductionColumn.LOCAL_UPDATE_COLUMN);
    });
  }
}

export async function savePlanProduction(
  db: knex,
  id: number | undefined,
  data: string
): Promise<void> {
  const localUpdate = new Date();
  if (id === undefined) {
    // tslint:disable-next-line:no-null-keyword
    await db(PLANS_PRODUCTION_TABLE_NAME).insert({id: null, data, sommeil: false, localUpdate});
  } else {
    await db(PLANS_PRODUCTION_TABLE_NAME)
      .where(PlansProductionColumn.ID_COLUMN, id)
      .update({data, localUpdate});
  }
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
        data: asString(r[PlansProductionColumn.DATA], ''),
        sommeil: asNumber(r[PlansProductionColumn.SOMMEIL_COLUMN], 0) === 1,
        localUpdate: asNumber(r[PlansProductionColumn.LOCAL_UPDATE_COLUMN], 0),
      };
    });
}

// export async function getNextPlanProductionId()
