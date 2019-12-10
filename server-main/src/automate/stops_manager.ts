import {SQLITE_DB} from '@root/db';
import {prodHoursStore} from '@root/prod_hours_store';
import {addError} from '@root/state';

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
import {
  firstSpeedTimeMatchingBetween,
  getAverageSpeedBetween,
  getLastSpeedTime,
  nextDefinedSpeed,
} from '@shared/db/speed_times';
import {getCurrentNonProd} from '@shared/lib/prod_hours';
import {Stop, Prod, StopType} from '@shared/models';

const WAIT_BETWEEN_PROCESS = 1000;
const SPEED_THRESHOLD_FOR_STOP = 50;

class StopsManager {
  // If a stop has started, returns the new stop start time, otherwise returns undefined
  private async getNextStopStart(
    lastStop: Stop | undefined,
    lastProd: Prod | undefined,
    lastTime: number
  ): Promise<number | undefined> {
    let lastStopEndTime = 0;
    if (lastStop !== undefined) {
      if (lastStop.end === undefined) {
        // Stop is already in progress
        return undefined;
      } else {
        lastStopEndTime = lastStop.end;
      }
    }

    if (lastProd && lastProd.end) {
      lastStopEndTime = Math.max(lastProd.end, lastStopEndTime);
    }
    if (lastStop && lastStop.end) {
      lastStopEndTime = Math.max(lastStop.end, lastStopEndTime);
    }

    const nextStopStart = await firstSpeedTimeMatchingBetween(
      SQLITE_DB.Prod,
      lastStopEndTime,
      lastTime,
      '<',
      SPEED_THRESHOLD_FOR_STOP
    );
    return nextStopStart && nextStopStart.time;
  }

  // If a prod has started, returns the new prod start time, otherwise returns undefined
  private async getNextProdStart(
    lastProd: Prod | undefined,
    lastStop: Stop | undefined,
    lastTime: number
  ): Promise<number | undefined> {
    let lastProdEndTime = 0;
    if (lastProd !== undefined) {
      if (lastProd.end === undefined) {
        // Prod is already in progress
        return undefined;
      } else {
        lastProdEndTime = lastProd.end;
      }
    }

    if (lastProd && lastProd.end) {
      lastProdEndTime = Math.max(lastProd.end, lastProdEndTime);
    }
    if (lastStop && lastStop.end) {
      lastProdEndTime = Math.max(lastStop.end, lastProdEndTime);
    }

    if (lastProdEndTime === 0 && lastStop) {
      lastProdEndTime = lastStop.end ? lastStop.end : lastStop.start;
    }

    const nextProdStart = await firstSpeedTimeMatchingBetween(
      SQLITE_DB.Prod,
      lastProdEndTime,
      lastTime,
      '>=',
      SPEED_THRESHOLD_FOR_STOP
    );

    // TODO - Have the same logic for `getNextStopStart`?
    if (nextProdStart === undefined) {
      return undefined;
    }
    if (lastStop && lastStop.start > nextProdStart.time) {
      return undefined;
    }
    return nextProdStart.time;
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
    const [
      lastStop,
      lastProd,
      lastStopWithPlanProdId,
      lastProdWithPlanProdId,
      lastTime,
    ] = await Promise.all([
      getLastStop(SQLITE_DB.Prod),
      getLastProd(SQLITE_DB.Prod),
      getLastStopWithPlanProdId(SQLITE_DB.Prod),
      getLastProdWithPlanProdId(SQLITE_DB.Prod),
      getLastSpeedTime(SQLITE_DB.Prod, true),
    ]);

    if (lastTime === undefined) {
      return false;
    }

    // Part 1 - Check if we are going in or out of a NonProd
    // If we are going in, we end the current prod/stop and start a NonProd stop
    // If we are going out, we end the current NonProd and start a new prod or stop
    const nonProd = getCurrentNonProd(
      new Date(lastTime.time),
      prodHoursStore.getProdRanges(),
      prodHoursStore.getNonProds()
    );
    const nonProdTrackingPromises: Promise<void>[] = [];

    if (nonProd) {
      // Start a NonProd if not done already
      let nonProdStart = nonProd.start;
      let shouldRecordNonProdStart = false;
      let planProdId: number | undefined;
      if (
        lastStop &&
        (lastStop.stopType !== StopType.NotProdHours || lastStop.title !== nonProd.title) &&
        lastStop.end === undefined
      ) {
        if (nonProdStart < lastStop.start) {
          nonProdStart = lastTime.time;
        }
        nonProdTrackingPromises.push(recordStopEnd(SQLITE_DB.Prod, lastStop.start, nonProdStart));
        shouldRecordNonProdStart = true;
        planProdId = lastStop.planProdId;
      } else if (lastProd && lastProd.end === undefined) {
        if (nonProdStart < lastProd.start) {
          nonProdStart = lastTime.time;
        }
        nonProdTrackingPromises.push(recordProdEnd(SQLITE_DB.Prod, lastProd.start, nonProdStart));
        shouldRecordNonProdStart = true;
        planProdId = lastProd.planProdId;
      }
      if (shouldRecordNonProdStart) {
        nonProdTrackingPromises.push(
          recordStopStart(
            SQLITE_DB.Prod,
            nonProdStart,
            planProdId,
            StopType.NotProdHours,
            nonProd.title
          )
        );
      }
    } else if (
      lastStop &&
      lastStop.stopType === StopType.NotProdHours &&
      lastStop.end === undefined
    ) {
      // End the NonProd if not done already
      const currentNonProd = getCurrentNonProd(
        new Date(lastStop.start),
        prodHoursStore.getProdRanges(),
        prodHoursStore.getNonProds()
      );
      if (currentNonProd && currentNonProd.end > lastStop.start) {
        nonProdTrackingPromises.push(
          recordStopEnd(SQLITE_DB.Prod, lastStop.start, currentNonProd.end)
        );
        const nextSpeed = await nextDefinedSpeed(SQLITE_DB.Prod, currentNonProd.end);
        if (nextSpeed && nextSpeed.speed !== undefined) {
          if (nextSpeed.speed < SPEED_THRESHOLD_FOR_STOP) {
            // Start a new stop
            nonProdTrackingPromises.push(
              recordStopStart(SQLITE_DB.Prod, currentNonProd.end, lastStop.planProdId)
            );
          } else {
            // Start a new prod
            nonProdTrackingPromises.push(
              recordProdStart(SQLITE_DB.Prod, currentNonProd.end, lastStop.planProdId)
            );
          }
        }
      }
    }
    if (nonProdTrackingPromises.length > 0) {
      await Promise.all(nonProdTrackingPromises);
      return true;
    }

    // We wait for the end of the non prod before doing anything else
    if (nonProd) {
      return false;
    }

    // Part 2 - Check if there are any stop or prod in progress. If so we end them if we need to,
    // and create a new prod or stop.
    const [newStopStartTime, newProdStartTime] = await Promise.all([
      this.getNextStopStart(lastStop, lastProd, lastTime.time),
      this.getNextProdStart(lastProd, lastStop, lastTime.time),
    ]);
    const lastPlanProdId = this.getLastPlanProdId(lastStopWithPlanProdId, lastProdWithPlanProdId);
    const newStopOrProdPromise: Promise<void>[] = [];
    let prodEnded = false;

    if (newStopStartTime !== undefined) {
      // When a stop start, a prod ends.
      if (lastProd && lastProd.end === undefined) {
        // Compute the average speed of this prod
        newStopOrProdPromise.push(recordProdEnd(SQLITE_DB.Prod, lastProd.start, newStopStartTime));
        prodEnded = true;
      }
      newStopOrProdPromise.push(recordStopStart(SQLITE_DB.Prod, newStopStartTime, lastPlanProdId));
    }

    if (newProdStartTime !== undefined) {
      // When a prod start, a stop ends.
      if (lastStop && lastStop.end === undefined) {
        newStopOrProdPromise.push(recordStopEnd(SQLITE_DB.Prod, lastStop.start, newProdStartTime));
      }
      newStopOrProdPromise.push(recordProdStart(SQLITE_DB.Prod, newProdStartTime, lastPlanProdId));
    }

    if (newStopOrProdPromise.length > 0) {
      await Promise.all(newStopOrProdPromise);
      return true;
    }

    // Part 3 - If there is a prod in progress, we update its average speed
    if (!prodEnded && lastProd !== undefined && lastProd.end === undefined) {
      const averageSpeed = await getAverageSpeedBetween(
        SQLITE_DB.Prod,
        lastProd.start,
        lastTime.time
      );
      if (averageSpeed !== lastProd.avgSpeed) {
        await updateProdSpeed(SQLITE_DB.Prod, lastProd.start, averageSpeed);
      }
    }

    return false;
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
        addError("Erreur dans le gestionnaire d'arrêts", err as string);
        setTimeout(() => this.process(), WAIT_BETWEEN_PROCESS);
      });
  }

  public start(): void {
    this.process();
  }
}

export const stopsManager = new StopsManager();
