import knex from 'knex';
import {asString} from '@shared/type_utils';

export const db = knex({
  client: 'sqlite3',
  connection: {
    user: process.env.SQLITE_DATABASE_USER,
    password: process.env.SQLITE_DATABASE_PASSWORD,
    filename: asString(process.env.SQLITE_DATABASE_PATH, ''),
  },
});
