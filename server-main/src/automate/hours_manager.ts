import {SQLITE_DB} from '@root/db';
import {addError} from '@root/state';

import {getLastHour, insertHourStats} from '@shared/db/speed_hours';
import {getLastMinute, getFirstMinute, getMinutesSpeedsBetween} from '@shared/db/speed_minutes';
import {HourStats} from '@shared/models';
import {removeUndefined} from '@shared/type_utils';

const WAIT_BETWEEN_PROCESS = 60 * 1000;

class HoursManager {
  private async getFakeLastHourTimestamp(): Promise<number> {
    const firstMinute = await getFirstMinute(SQLITE_DB.Prod);
    if (!firstMinute) {
      return 0;
    }
    const asDate = new Date(firstMinute.minute);
    asDate.setHours(asDate.getHours() - 1);
    asDate.setMinutes(0);
    asDate.setSeconds(0);
    asDate.setMilliseconds(0);
    return asDate.getTime();
  }

  private getMedian(sortedSpeeds: number[]): number {
    if (sortedSpeeds.length === 1) {
      return sortedSpeeds[0];
    }
    const mid = sortedSpeeds.length / 2;
    const low = Math.floor(mid / 2);
    const high = Math.ceil(mid / 2);
    return (sortedSpeeds[low] + sortedSpeeds[high]) / 2;
  }

  private async analyseHours(): Promise<boolean> {
    const lastHour = await getLastHour(SQLITE_DB.Prod);
    const lastMinuteSpeed = await getLastMinute(SQLITE_DB.Prod);
    const lastMinute = lastMinuteSpeed === undefined ? 0 : lastMinuteSpeed.minute;

    const lastHourTimestamp = lastHour ? lastHour.hour : await this.getFakeLastHourTimestamp();
    const dateToMaybeProcess = new Date(lastHourTimestamp);
    dateToMaybeProcess.setHours(dateToMaybeProcess.getHours() + 1);

    const lastMinuteStartOfHour = new Date(lastMinute);
    lastMinuteStartOfHour.setMinutes(0);
    lastMinuteStartOfHour.setSeconds(0);
    lastMinuteStartOfHour.setMilliseconds(0);

    if (dateToMaybeProcess.getTime() < lastMinuteStartOfHour.getTime()) {
      const nextHour = new Date(dateToMaybeProcess.getTime());
      nextHour.setHours(nextHour.getHours() + 1);

      const minuteSpeeds = await getMinutesSpeedsBetween(
        SQLITE_DB.Prod,
        dateToMaybeProcess.getTime(),
        nextHour.getTime()
      );
      const nulls = minuteSpeeds.filter(ms => ms.speed === undefined);
      const speeds = minuteSpeeds.filter(ms => ms.speed !== undefined);
      let hourStats: HourStats = {
        hour: dateToMaybeProcess.getTime(),
        nullCount: nulls.length,
        speedCount: speeds.length,
      };
      if (speeds.length > 0) {
        const sortedBySpeed = [...speeds].sort((s1, s2) => (s1.speed || 0) - (s2.speed || 0));
        const sortedByTime = [...speeds].sort((s1, s2) => s1.minute - s2.minute);
        const speedSum = speeds.reduce((acc, curr) => (curr.speed || 0) + acc, 0);
        const safeSpeeds = removeUndefined(sortedBySpeed.map(ms => ms.speed));

        const avgSpeed = speedSum / speeds.length;
        const medianSpeed = this.getMedian(safeSpeeds);
        const firstSpeed = sortedByTime[0].speed;
        const lastSpeed = sortedByTime[sortedByTime.length - 1].speed;
        const minSpeed = sortedBySpeed[0].speed;
        const maxSpeed = sortedBySpeed[sortedBySpeed.length - 1].speed;

        hourStats = {
          ...hourStats,
          ...{
            avgSpeed,
            medianSpeed,
            firstSpeed,
            lastSpeed,
            minSpeed,
            maxSpeed,
          },
        };
      }

      await insertHourStats(SQLITE_DB.Prod, hourStats);
      return true;
    }
    return false;
  }

  private process(): void {
    this.analyseHours()
      .then(hasDoneSomething => {
        if (hasDoneSomething) {
          setTimeout(() => this.process(), 0);
        } else {
          setTimeout(() => this.process(), WAIT_BETWEEN_PROCESS);
        }
      })
      .catch(err => {
        addError("Erreur dans l'aggregateur d'heures", err);
        setTimeout(() => this.process(), WAIT_BETWEEN_PROCESS);
      });
  }

  public start(): void {
    this.process();
  }
}

export const hoursManager = new HoursManager();
