import knex from 'knex';
import {asString} from '@shared/type_utils';

const GESCOM_USER = 'ProDune';
const GESCOM_PASSWORD = 'Per1';
const GESCOM_SERVER = 'DUNE-SAGE\\SAGE64';
const GESCOM_DATABASE = 'DUNE';

export const sqliteDB = knex({
  client: 'sqlite3',
  connection: {
    user: process.env.SQLITE_DATABASE_USER,
    password: process.env.SQLITE_DATABASE_PASSWORD,
    filename: asString(process.env.SQLITE_DATABASE_PATH, ''),
  },
  useNullAsDefault: true,
});

export const gescomDB = knex({
  client: 'mssql',
  connection: {
    server: GESCOM_SERVER,
    user: GESCOM_USER,
    password: GESCOM_PASSWORD,
    database: GESCOM_DATABASE,
  },
});
