import {ProdHoursStore} from '@shared/server_stores';
import {SQLITE_DB} from './db';

export const prodHoursStore = new ProdHoursStore(SQLITE_DB.Prod, SQLITE_DB.Params);
