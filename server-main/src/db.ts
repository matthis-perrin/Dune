import knex from 'knex';
import path from 'path';

import {GESCOM_DB, PARAMS_DB, PROD_DB} from '@shared/db/database_names';
import {asString} from '@shared/type_utils';

const GESCOM_USER = 'ProDune';
const GESCOM_PASSWORD = 'Per1';
const GESCOM_SERVER = 'DUNE-SAGE\\SAGE64';
const GESCOM_DATABASE = 'DUNE';

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
  Prod: createDB(PROD_DB),
  Params: createDB(PARAMS_DB),
};

export const gescomDB = knex({
  client: 'mssql',
  connection: {
    server: GESCOM_SERVER,
    user: GESCOM_USER,
    password: GESCOM_PASSWORD,
    database: GESCOM_DATABASE,
  },
});
