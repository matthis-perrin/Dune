import {SQLITE_DB} from '@root/db';
import {addError} from '@root/state';

import {firstSpeedMatchingSince, getAverageSpeedBetween} from '@shared/db/speed_minutes';
import {
  getLastProd,
  recordProdEnd,
  recordProdStart,
  getLastProdWithPlanProdId,
  updateProdSpeed,
} from '@shared/db/speed_prods';
import {
  getLastStop,
  recordStopStart,
  recordStopEnd,
  getLastStopWithPlanProdId,
} from '@shared/db/speed_stops';
import {Stop, Prod} from '@shared/models';

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
      SQLITE_DB.Prod,
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

    const nextProdStart = await firstSpeedMatchingSince(
      SQLITE_DB.Prod,
      lastProdEndTime,
      '>=',
      SPEED_THRESHOLD_FOR_STOP
    );
    return nextProdStart && nextProdStart.minute;
  }

  private getLastPlanProdId(
    lastStopWithPlanProdId: Stop | undefined,
    lastProdWithPlanProdId: Prod | undefined
  ): number | undefined {
    if (lastStopWithPlanProdId !== undefined) {
      if (lastProdWithPlanProdId !== undefined) {
        return lastStopWithPlanProdId.start < lastProdWithPlanProdId.start
          ? lastProdWithPlanProdId.planProdId
          : lastStopWithPlanProdId.planProdId;
      } else {
        return lastStopWithPlanProdId.planProdId;
      }
    } else {
      if (lastProdWithPlanProdId !== undefined) {
        return lastProdWithPlanProdId.planProdId;
      } else {
        return undefined;
      }
    }
  }

  private async analyseStopsAndProds(): Promise<boolean> {
    const [lastStop, lastProd, lastStopWithPlanProdId, lastProdWithPlanProdId] = await Promise.all([
      getLastStop(SQLITE_DB.Prod),
      getLastProd(SQLITE_DB.Prod),
      getLastStopWithPlanProdId(SQLITE_DB.Prod),
      getLastProdWithPlanProdId(SQLITE_DB.Prod),
    ]);

    const newStopStartTime = await this.getNextStopStart(lastStop);
    const newProdStartTime = await this.getNextProdStart(lastProd);
    const lastPlanProdId = this.getLastPlanProdId(lastStopWithPlanProdId, lastProdWithPlanProdId);

    if (newStopStartTime !== undefined) {
      // When a stop start, a prod ends.
      if (lastProd && lastProd.end === undefined) {
        // Compute the average speed of this prod
        const averageSpeed = await getAverageSpeedBetween(
          SQLITE_DB.Prod,
          lastProd.start,
          newStopStartTime
        );
        await recordProdEnd(SQLITE_DB.Prod, lastProd.start, newStopStartTime, averageSpeed);
      }
      await recordStopStart(SQLITE_DB.Prod, newStopStartTime, lastPlanProdId);
    }

    if (newProdStartTime !== undefined) {
      // When a prod start, a stop ends.
      if (lastStop && lastStop.end === undefined) {
        await recordStopEnd(SQLITE_DB.Prod, lastStop.start, newProdStartTime);
      }
      await recordProdStart(SQLITE_DB.Prod, newProdStartTime, lastPlanProdId);
    } else if (lastProd !== undefined && lastProd.end === undefined) {
      const averageSpeed = await getAverageSpeedBetween(SQLITE_DB.Prod, lastProd.start, Date.now());
      if (averageSpeed !== lastProd.avgSpeed) {
        await updateProdSpeed(SQLITE_DB.Prod, lastProd.start, averageSpeed);
      }
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
