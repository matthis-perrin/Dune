import knex from 'knex';

import {OPERATIONS_TABLE_NAME} from '@shared/db/table_names';
import {Operation, OperationConstraint} from '@shared/models';
import {asMap, asNumber, asString, asBoolean} from '@shared/type_utils';

export const OperationsColumn = {
  REF_COLUMN: 'ref',
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
      table.increments(OperationsColumn.REF_COLUMN);
      table.string(OperationsColumn.DESCRIPTION_COLUMN);
      table.boolean(OperationsColumn.REQUIRED_COLUMN);
      table.string(OperationsColumn.CONSTRAINT_COLUMN);
      table.integer(OperationsColumn.DURATION_COLUMN);
      table.boolean(OperationsColumn.SOMMEIL_COLUMN);
      table.dateTime(OperationsColumn.LOCAL_UPDATE_COLUMN);
    });
  }
}

// tslint:disable-next-line:no-any
function rowToOperation(operationLine: any): Operation {
  const o = asMap(operationLine);
  return {
    ref: asString(o[OperationsColumn.REF_COLUMN], ''),
    description: asString(o[OperationsColumn.DESCRIPTION_COLUMN], ''),
    required: asBoolean(o[OperationsColumn.REQUIRED_COLUMN]),
    constraint: asString(
      o[OperationsColumn.CONSTRAINT_COLUMN],
      OperationConstraint.None
    ) as OperationConstraint,
    duration: asNumber(o[OperationsColumn.DURATION_COLUMN], 0),
    sommeil: asBoolean(o[OperationsColumn.SOMMEIL_COLUMN]),
    localUpdate: asNumber(o[OperationsColumn.LOCAL_UPDATE_COLUMN], 0),
  };
}

export async function createOrUpdateOperation(db: knex, operation: Operation): Promise<Operation> {
  const localUpdate = new Date();
  const ref = operation.ref;
  if (ref === '-1') {
    // Creation mode
    const operationFields = {...operation};
    delete operationFields.ref;
    delete operationFields.localUpdate;
    return rowToOperation(
      await db(OPERATIONS_TABLE_NAME).insert({...operationFields, localUpdate})
    );
  } else {
    // Update mode
    const operationFields = {...operation};
    operationFields.localUpdate = new Date().getTime();
    return rowToOperation(
      await db(OPERATIONS_TABLE_NAME)
        .where(OperationsColumn.REF_COLUMN, operationFields.ref)
        .update(operationFields)
    );
  }
}

export async function listOperations(db: knex, sinceLocalUpdate: number): Promise<Operation[]> {
  return db(OPERATIONS_TABLE_NAME)
    .select()
    .where(OperationsColumn.LOCAL_UPDATE_COLUMN, '>', new Date(sinceLocalUpdate))
    .map(rowToOperation);
}
