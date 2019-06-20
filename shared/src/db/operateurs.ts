import knex from 'knex';

import {OPERATEURS_TABLE_NAME} from '@shared/db/table_names';
// import {Operateur} from '@shared/models';
// import {asDate, asMap, asNumber, asString, asBoolean} from '@shared/type_utils';

export const OperateursColumn = {
  ID_COLUMN: 'id',
  NAME_COLUMN: 'name',
  OPERATION_IDS: 'operation_ids',
  SOMMEIL_COLUMN: 'sommeil',
  LOCAL_UPDATE_COLUMN: 'localUpdate',
};

export async function createOperateursTable(db: knex): Promise<void> {
  const hasTable = await db.schema.hasTable(OPERATEURS_TABLE_NAME);
  if (!hasTable) {
    await db.schema.createTable(OPERATEURS_TABLE_NAME, table => {
      table.increments(OperateursColumn.ID_COLUMN);
      table.string(OperateursColumn.NAME_COLUMN);
      table.string(OperateursColumn.OPERATION_IDS);
      table.boolean(OperateursColumn.SOMMEIL_COLUMN);
      table.dateTime(OperateursColumn.LOCAL_UPDATE_COLUMN);
    });
  }
}

// // tslint:disable-next-line:no-any
// function rowToOperateur(operateurLine: any): Operateur {
//   const o = asMap(operateurLine);
//   return {
//     id: asNumber(o[OperateursColumn.ID_COLUMN], 0),
//     name: asString(o[OperateursColumn.NAME_COLUMN], ''),
//     required: asBoolean(o[OperateursColumn.REQUIRED_COLUMN]),
//     constraint: asString(
//       o[OperateursColumn.CONSTRAINT_COLUMN],
//       OperateurConstraint.None
//     ) as OperateurConstraint,
//     duration: asNumber(o[OperateursColumn.DURATION_COLUMN], 0),
//     sommeil: asBoolean(o[OperateursColumn.SOMMEIL_COLUMN]),
//     localUpdate: asDate(o[OperateursColumn.LOCAL_UPDATE_COLUMN]),
//   };
// }

// export async function createOrUpdateOperateur(db: knex, operateur: Operateur): Promise<Operateur> {
//   const localUpdate = new Date();
//   const id = operateur.id;
//   if (id === -1) {
//     // Creation mode
//     const operateurFields = {...operateur};
//     delete operateurFields.id;
//     delete operateurFields.localUpdate;
//     return rowToOperateur(
//       await db(OPERATEURS_TABLE_NAME).insert({...operateurFields, localUpdate})
//     );
//   } else {
//     // Update mode
//     const operateurFields = {...operateur};
//     operateurFields.localUpdate = new Date();
//     return rowToOperateur(
//       await db(OPERATEURS_TABLE_NAME)
//         .where('id', operateurFields.id)
//         .update(operateurFields)
//     );
//   }
// }

// export async function listOperateurs(db: knex, sinceLocalUpdate: number): Promise<Operateur[]> {
//   return db(OPERATEURS_TABLE_NAME)
//     .select()
//     .where(OperateursColumn.LOCAL_UPDATE_COLUMN, '>', new Date(sinceLocalUpdate))
//     .map(rowToOperateur);
// }
