import knex from 'knex';

import {OPERATIONS_TABLE_NAME} from '@shared/db/table_names';
import {Operation, OperationConstraint, OperationGroup} from '@shared/models';
import {asMap, asNumber, asString, asBoolean} from '@shared/type_utils';

export const OperationsColumn = {
  REF_COLUMN: 'ref',
  DESCRIPTION_COLUMN: 'description',
  REQUIRED_COLUMN: 'required',
  CONSTRAINT_COLUMN: 'constraint',
  DURATION_COLUMN: 'duration',
  GROUP_COLUMN: 'group',
};

export async function createOperationsTable(db: knex): Promise<void> {
  const hasTable = await db.schema.hasTable(OPERATIONS_TABLE_NAME);
  if (!hasTable) {
    await db.schema.createTable(OPERATIONS_TABLE_NAME, table => {
      table.integer(OperationsColumn.REF_COLUMN).primary().notNullable();
      table.string(OperationsColumn.DESCRIPTION_COLUMN).notNullable();
      table.boolean(OperationsColumn.REQUIRED_COLUMN).notNullable();
      table.string(OperationsColumn.CONSTRAINT_COLUMN).notNullable();
      table.integer(OperationsColumn.DURATION_COLUMN).notNullable();
      table.string(OperationsColumn.GROUP_COLUMN).notNullable();
    });
  }
}

// tslint:disable-next-line:no-any
function rowToOperation(operationLine: any): Operation {
  const o = asMap(operationLine);
  return {
    ref: `OP_${asNumber(o[OperationsColumn.REF_COLUMN], 0)}`,
    description: asString(o[OperationsColumn.DESCRIPTION_COLUMN], ''),
    required: asBoolean(o[OperationsColumn.REQUIRED_COLUMN]),
    constraint: asString(
      o[OperationsColumn.CONSTRAINT_COLUMN],
      OperationConstraint.None
    ) as OperationConstraint,
    duration: asNumber(o[OperationsColumn.DURATION_COLUMN], 0),
    group: asString(o[OperationsColumn.GROUP_COLUMN], OperationGroup.Aide),
  };
}

export async function listOperations(db: knex): Promise<Operation[]> {
  return db(OPERATIONS_TABLE_NAME).select().map(rowToOperation);
}
