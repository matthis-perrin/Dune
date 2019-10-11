import knex from 'knex';

import {GESCOM_DB, PARAMS_DB, PROD_DB} from '@shared/db/database_names';

function createDB(dbName: string): knex {
  return knex({
    client: 'mysql',
    connection: {
      host: process.env.SQLITE_DATABASE_HOST,
      user: process.env.SQLITE_DATABASE_USER,
      password: process.env.SQLITE_DATABASE_PASSWORD,
      database: dbName,
    },
  });
}

export const SQLITE_DB = {
  Gescom: createDB(GESCOM_DB),
  Prod: createDB(PROD_DB),
  Params: createDB(PARAMS_DB),
};
