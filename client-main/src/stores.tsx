import {SQLITE_DB} from '@root/db';
import {ProdHoursStore, ConstantsStore} from '@shared/server_stores';

export const prodHoursStore = new ProdHoursStore(SQLITE_DB.Prod, SQLITE_DB.Params);
export const constantsStore = new ConstantsStore(SQLITE_DB.Params);
