import {addError} from '@root/state';

import {
  getLastSpeedTime,
  getSpeedTimesSince,
  insertOrUpdateSpeedTimes,
} from '@shared/db/speed_times';
import {SpeedTime} from '@shared/models';
import Knex from 'knex';

function min<T>(values: T[]): T | undefined {
  return values.reduce(
    (acc, curr) => (acc === undefined || curr < acc ? curr : acc),
    undefined as T | undefined
  );
}

function max<T>(values: T[]): T | undefined {
  return values.reduce(
    (acc, curr) => (acc === undefined || curr > acc ? curr : acc),
    undefined as T | undefined
  );
}

function find<T>(values: T[], predicate: (v: T) => boolean): T | undefined {
  for (const v of values) {
    if (predicate(v)) {
      return v;
    }
  }
  return undefined;
}

function sum(values: number[]): number {
  return values.reduce((acc, curr) => acc + curr, 0);
}

export const AGGREGATION_SIZE_MS = 5000;
const WAIT_BETWEEN_BUFFER_PROCESS_ATTEMPT = 500;
const INSERT_BATCH_SIZE = 500;

export class Aggregator {
  // AP
  public constructor(private readonly db: Knex) {}
  private lastSpeed: SpeedTime | undefined;
  private readonly queries = new Map<number, number | undefined>();
  private readonly buffers = new Map<number, number[]>();
  private lastInsertedTime: number = 0;
  private processBufferTimeout: NodeJS.Timeout | undefined;

  public async start(): Promise<void> {
    // AP
    const lastSpeedTime = await getLastSpeedTime(this.db, true);
    const lastMinute = lastSpeedTime === undefined ? this.getStartOfDay() : lastSpeedTime.time;
    this.lastInsertedTime = lastMinute;
    this.processBuffersIfNeeded();
  }

  private processBuffersIfNeeded(): void {
    if (this.processBufferTimeout) {
      clearTimeout(this.processBufferTimeout);
    }

    this.updateQueries()
      .then(() => {
        if (this.queries.size > 0) {
          const timesToInsert = Array.from(this.queries.keys()).sort().slice(0, INSERT_BATCH_SIZE);
          const speedByTime = new Map<number, number | undefined>();
          timesToInsert.forEach(m => speedByTime.set(m, this.queries.get(m)));
          // AP
          insertOrUpdateSpeedTimes(this.db, speedByTime)
            .then(() => {
              this.lastInsertedTime = max(Array.from(speedByTime.keys())) || 0;
              speedByTime.forEach((speed, time) => {
                this.queries.delete(time);
              });
              if (this.queries.size > 0) {
                this.processBuffersIfNeeded();
              } else {
                this.scheduleBufferProcessing();
              }
            })
            .catch(error => {
              addError(
                "Erreur dans l'aggregateur de l'automate pendant la mise à jour de la base.",
                String(error)
              );
              this.scheduleBufferProcessing();
            });
        } else {
          this.scheduleBufferProcessing();
        }
      })
      .catch(error => {
        addError(
          "Erreur dans l'aggregateur de l'automate pendant la création des requêtes SQL.",
          String(error)
        );
        this.scheduleBufferProcessing();
      });
  }

  private scheduleBufferProcessing(): void {
    this.processBufferTimeout = setTimeout(
      () => this.processBuffersIfNeeded(),
      WAIT_BETWEEN_BUFFER_PROCESS_ATTEMPT
    );
  }

  private async updateQueries(): Promise<void> {
    const times = Array.from(this.buffers.keys());
    const start = Math.min(this.lastInsertedTime, min(times) || this.lastInsertedTime);
    const currentTime = this.getCurrentTime();
    // AP
    const valuesInDB = await getSpeedTimesSince(this.db, start);
    const timesToProcess = this.allTimesInRange(start, currentTime);
    timesToProcess.forEach(m => {
      const timeBuffer = this.buffers.get(m);
      this.buffers.delete(m);
      const dbValue = find(valuesInDB, v => v.time === m);
      if (timeBuffer !== undefined && timeBuffer.length > 0) {
        this.queries.set(m, this.getAverageSpeed(timeBuffer));
      } else if (dbValue === undefined) {
        this.queries.set(m, undefined);
      }
    });
  }

  private getAverageSpeed(speeds: number[]): number {
    if (speeds.length === 0) {
      return 0;
    }
    const speedSum = sum(speeds);
    const averageSpeed = speedSum / speeds.length;
    const roundedAverageSpeed = Math.round(averageSpeed * 1000) / 1000;
    return roundedAverageSpeed;
  }

  // end not included
  private allTimesInRange(start: number, end: number): number[] {
    if (start >= end) {
      return [];
    }
    let current = start;
    const times = [];
    while (current < end) {
      times.push(current);
      current += AGGREGATION_SIZE_MS;
    }
    return times;
  }

  public getCurrentTime(): number {
    return Math.round(Date.now() / AGGREGATION_SIZE_MS) * AGGREGATION_SIZE_MS;
  }

  private getStartOfDay(): number {
    const now = new Date();
    now.setHours(0);
    now.setMinutes(0);
    now.setSeconds(0);
    now.setMilliseconds(0);
    return now.getTime();
  }

  public getLastReceivedSpeed(): SpeedTime | undefined {
    return this.lastSpeed;
  }

  public addSpeed(speed: number): void {
    const currentTime = this.getCurrentTime();
    const currentBuffer = this.buffers.get(currentTime);
    this.lastSpeed = {time: Date.now(), speed};
    if (currentBuffer) {
      currentBuffer.push(speed);
    } else {
      this.buffers.set(currentTime, [speed]);
    }
  }
}
