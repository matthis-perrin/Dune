import knex from 'knex';
import path from 'path';

import {AUTOMATE_DB, DATA_DB, GESCOM_DB, PARAMS_DB} from '@shared/db/database_names';
import {asString} from '@shared/type_utils';

function createDB(dbName: string): knex {
  return knex({
    client: 'sqlite3',
    connection: {
      user: process.env.SQLITE_DATABASE_USER,
      password: process.env.SQLITE_DATABASE_PASSWORD,
      filename: path.join(asString(process.env.SQLITE_DATABASE_PATH, ''), dbName),
    },
    useNullAsDefault: true,
  });
}

export const SQLITE_DB = {
  Gescom: createDB(GESCOM_DB),
  Automate: createDB(AUTOMATE_DB),
  Prod: createDB(DATA_DB),
  Params: createDB(PARAMS_DB),
};
