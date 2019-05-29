import knex from 'knex';

const GESCOM_USER = 'ProDune';
const GESCOM_PASSWORD = 'Per1';
const GESCOM_SERVER = 'DUNE-SAGE\\SAGE64';
const GESCOM_DATABASE = 'DUNE';

export const sqliteDB = knex({
  client: 'sqlite3',
  connection: {
    filename: '../database.sqlite',
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
