import knex from 'knex';

import {CONSTANTS_TABLE_NAME} from '@shared/db/table_names';
import {Constants} from '@shared/models';
import {asMap, asString} from '@shared/type_utils';

export const ColorsColumn = {
  NAME_COLUMN: 'name',
  VALUE_COLUMN: 'value',
};

export async function createConstantsTable(db: knex): Promise<void> {
  const hasTable = await db.schema.hasTable(CONSTANTS_TABLE_NAME);
  if (!hasTable) {
    await db.schema.createTable(CONSTANTS_TABLE_NAME, table => {
      table
        .string(ColorsColumn.NAME_COLUMN)
        .notNullable()
        .primary();
      table.string(ColorsColumn.VALUE_COLUMN).notNullable();
    });
  }
}

function getNumber(values: {name: string; value: string}[], name: string): number {
  for (const value of values) {
    if (value.name === name) {
      const parsedValue = parseFloat(value.value);
      if (isNaN(parsedValue) || !isFinite(parsedValue)) {
        throw new Error(`Invalid value for constant ${name} (got ${value.value})`);
      }
      return parsedValue;
    }
  }
  throw new Error(`No constant named ${name} in DB`);
}

export async function listConstants(db: knex): Promise<Constants> {
  const res = await db(CONSTANTS_TABLE_NAME)
    .select()
    .map(constantLine => {
      const c = asMap(constantLine);
      return {
        name: asString(c[ColorsColumn.NAME_COLUMN], ''),
        value: asString(c[ColorsColumn.VALUE_COLUMN], ''),
      };
    });
  return {
    maxSpeed: getNumber(res, 'maxSpeed'),
    maxSpeedRatio: getNumber(res, 'maxSpeedRatio'),
    nombreEncriers: getNumber(res, 'nombreEncriers'),
    reglageRepriseProdMs: getNumber(res, 'reglageRepriseProdMs'),
  };
}
