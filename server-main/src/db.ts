// import log from 'electron-log';
import knex from 'knex';

import {GESCOM_DB, PARAMS_DB, PROD_DB} from '@shared/db/database_names';

const GESCOM_USER = 'ProDune';
const GESCOM_PASSWORD = 'Per1';
const GESCOM_SERVER = 'DUNE-SAGE\\SAGE64';
const GESCOM_DATABASE = 'DUNE';

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

export const gescomDB = knex({
  client: 'mssql',
  connection: {
    server: GESCOM_SERVER,
    user: GESCOM_USER,
    password: GESCOM_PASSWORD,
    database: GESCOM_DATABASE,
  },
});

// gescomDB.on('query', (query: any) => {
//   log.info(`GESCOM QUERY: ${query.sql} | PARAMS: ${query.bindings}`);
// });
