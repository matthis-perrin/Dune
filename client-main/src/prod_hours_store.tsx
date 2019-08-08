import {SQLITE_DB} from '@root/db';
import {ProdHoursStore} from '@shared/server_stores';

export const prodHoursStore = new ProdHoursStore(SQLITE_DB.Prod, SQLITE_DB.Params);
