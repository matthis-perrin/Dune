import {SQLITE_DB} from '@root/db';
import {addError} from '@root/state';

import {firstSpeedMatchingSince, getAverageSpeedBetween} from '@shared/db/speed_minutes';
import {getLastProd, recordProdEnd, recordProdStart} from '@shared/db/speed_prods';
import {getLastStop, recordStopStart, recordStopEnd} from '@shared/db/speed_stops';
import {Stop} from '@shared/models';

const WAIT_BETWEEN_PROCESS = 1000;
const SPEED_THRESHOLD_FOR_STOP = 50;

class StopsManager {
  // If a stop has started, returns the new stop start time, otherwise returns undefined
  private async getNextStopStart(lastStop: Stop | undefined): Promise<number | undefined> {
    let lastStopEndTime = 0;
    if (lastStop !== undefined) {
      if (lastStop.end === undefined) {
        // Stop is already in progress
        return undefined;
      } else {
        lastStopEndTime = lastStop.end;
      }
    }

    const nextStopStart = await firstSpeedMatchingSince(
      SQLITE_DB.Automate,
      lastStopEndTime,
      '<',
      SPEED_THRESHOLD_FOR_STOP
    );
    return nextStopStart && nextStopStart.minute;
  }

  // If a prod has started, returns the new prod start time, otherwise returns undefined
  private async getNextProdStart(lastProd: Stop | undefined): Promise<number | undefined> {
    let lastProdEndTime = 0;
    if (lastProd !== undefined) {
      if (lastProd.end === undefined) {
        // Prod is already in progress
        return undefined;
      } else {
        lastProdEndTime = lastProd.end;
      }
    }

    const nextStopStart = await firstSpeedMatchingSince(
      SQLITE_DB.Automate,
      lastProdEndTime,
      '>=',
      SPEED_THRESHOLD_FOR_STOP
    );
    return nextStopStart && nextStopStart.minute;
  }

  private async analyseStopsAndProds(): Promise<boolean> {
    const [lastStop, lastProd] = await Promise.all([
      getLastStop(SQLITE_DB.Automate),
      getLastProd(SQLITE_DB.Automate),
    ]);

    const newStopStartTime = await this.getNextStopStart(lastStop);
    const newProdStartTime = await this.getNextProdStart(lastProd);

    if (newStopStartTime !== undefined) {
      // When a stop start, a prod ends.
      if (lastProd && lastProd.end === undefined) {
        // Compute the average speed of this prod
        const averageSpeed = await getAverageSpeedBetween(
          SQLITE_DB.Automate,
          lastProd.start,
          newStopStartTime
        );
        await recordProdEnd(SQLITE_DB.Automate, lastProd.start, newStopStartTime, averageSpeed);
      }
      await recordStopStart(SQLITE_DB.Automate, newStopStartTime);
    }

    if (newProdStartTime !== undefined) {
      // When a prod start, a stop ends.
      if (lastStop && lastStop.end === undefined) {
        await recordStopEnd(SQLITE_DB.Automate, lastStop.start, newProdStartTime);
      }
      const planProdId = lastStop && lastStop.planProdId;
      await recordProdStart(SQLITE_DB.Automate, newProdStartTime, planProdId);
    }

    return newStopStartTime !== undefined || newProdStartTime !== undefined;
  }

  private process(): void {
    this.analyseStopsAndProds()
      .then(hasDoneSomething => {
        if (hasDoneSomething) {
          setTimeout(() => this.process(), 0);
        } else {
          setTimeout(() => this.process(), WAIT_BETWEEN_PROCESS);
        }
      })
      .catch(err => {
        addError("Erreur dans le gestionnaire d'arrêts", err);
        setTimeout(() => this.process(), WAIT_BETWEEN_PROCESS);
      });
  }

  public start(): void {
    this.process();
  }
}

export const stopsManager = new StopsManager();
