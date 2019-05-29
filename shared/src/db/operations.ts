import knex from 'knex';

import {OPERATIONS_TABLE_NAME} from '@shared/db/table_names';
import {Operation, OperationConstraint} from '@shared/models';
import {asDate, asMap, asNumber, asString, asBoolean, Omit} from '@shared/type_utils';

export const OperationsColumn = {
  ID_COLUMN: 'id',
  DESCRIPTION_COLUMN: 'description',
  REQUIRED_COLUMN: 'required',
  CONSTRAINT_COLUMN: 'constraint',
  DURATION_COLUMN: 'duration',
  SOMMEIL_COLUMN: 'sommeil',
  LOCAL_UPDATE_COLUMN: 'localUpdate',
};

export async function createOperationsTable(db: knex): Promise<void> {
  const hasTable = await db.schema.hasTable(OPERATIONS_TABLE_NAME);
  if (!hasTable) {
    await db.schema.createTable(OPERATIONS_TABLE_NAME, table => {
      table.increments(OperationsColumn.ID_COLUMN);
      table.string(OperationsColumn.DESCRIPTION_COLUMN);
      table.boolean(OperationsColumn.REQUIRED_COLUMN);
      table.string(OperationsColumn.CONSTRAINT_COLUMN);
      table.integer(OperationsColumn.DURATION_COLUMN);
      table.boolean(OperationsColumn.SOMMEIL_COLUMN);
      table.dateTime(OperationsColumn.LOCAL_UPDATE_COLUMN);
    });
  }
}

function rowToOperation(operationLine: any): Operation {
  const o = asMap(operationLine);
  return {
    id: asNumber(o[OperationsColumn.ID_COLUMN], 0),
    description: asString(o[OperationsColumn.DESCRIPTION_COLUMN], ''),
    required: asBoolean(o[OperationsColumn.DESCRIPTION_COLUMN]),
    constraint: asString(
      o[OperationsColumn.DESCRIPTION_COLUMN],
      OperationConstraint.None
    ) as OperationConstraint,
    duration: asNumber(o[OperationsColumn.DESCRIPTION_COLUMN], 0),
    sommeil: asBoolean(o[OperationsColumn.SOMMEIL_COLUMN]),
    localUpdate: asDate(o[OperationsColumn.LOCAL_UPDATE_COLUMN]),
  };
}

export async function createOperation(
  db: knex,
  operation: Omit<Operation, 'id' | 'localUpdate'>
): Promise<Operation> {
  const localUpdate = new Date();
  const row = await db(OPERATIONS_TABLE_NAME).insert({...operation, localUpdate});
  return rowToOperation(row);
}

export async function updateOperation(db: knex, operation: Operation): Promise<void> {
  operation.localUpdate = new Date();
  return db(OPERATIONS_TABLE_NAME)
    .where('id', operation.id)
    .update(operation);
}

export async function listOperations(db: knex, sinceLocalUpdate: number): Promise<Operation[]> {
  return await db(OPERATIONS_TABLE_NAME)
    .select()
    .where(OperationsColumn.LOCAL_UPDATE_COLUMN, '>', new Date(sinceLocalUpdate))
    .map(rowToOperation);
}
