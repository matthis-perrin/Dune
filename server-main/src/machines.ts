import {AutomateWatcher} from '@root/automate/watcher';
import {SQLITE_DB} from '@root/db';
import {Aggregator} from '@root/automate/aggregator';

// AP
export const aggregatorGiave = new Aggregator(SQLITE_DB.Prod);
export const aggregatorMondon = new Aggregator(SQLITE_DB.Prod);
export const automateWatcherGiave = new AutomateWatcher(
  '192.168.0.50',
  // tslint:disable-next-line: no-magic-numbers
  9600,
  '04',
  '0101B10014000001',
  aggregatorGiave,
  true
);
export const automateWatcherMondon = new AutomateWatcher(
  '192.168.0.50',
  // tslint:disable-next-line: no-magic-numbers
  9600,
  '03',
  '0101B10014000001',
  aggregatorMondon,
  true
);
