import {SQLITE_DB} from '@root/db';
import {addError} from '@root/state';

import {
  getLastMinute,
  getMinutesSpeedsSince,
  insertOrUpdateMinutesSpeeds,
} from '@shared/db/speed_minutes';

function min<T>(values: T[]): T | undefined {
  return values.reduce((acc, curr) => (acc === undefined || curr < acc ? curr : acc), undefined as
    | T
    | undefined);
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

const WAIT_BETWEEN_BUFFER_PROCESS = 5000;
const MAX_VALUES_IN_CURRENT_MINUTE_FOR_INSTANT_PROCESS = 5;

class Aggregator {
  private queries = new Map<number, number | undefined>();
  private readonly buffers = new Map<number, number[]>();
  private lastInsertedMinute: number = 0;
  private lastProcessingTime: number = 0;
  private processBufferTimeout: NodeJS.Timeout | undefined;

  public async start(): Promise<void> {
    const lastMinuteSpeed = await getLastMinute(SQLITE_DB.Automate);
    const lastMinute =
      lastMinuteSpeed === undefined ? this.getStartOfDay() : lastMinuteSpeed.minute;
    this.lastInsertedMinute = lastMinute;
    this.processBuffersIfNeeded();
  }

  private processBuffersIfNeeded(): void {
    if (this.processBufferTimeout) {
      clearTimeout(this.processBufferTimeout);
    }

    this.updateQueries()
      .then(() => {
        if (this.queries.size > 0) {
          insertOrUpdateMinutesSpeeds(SQLITE_DB.Automate, this.queries)
            .then(() => {
              this.lastInsertedMinute = min(Array.from(this.queries.keys())) || 0;
              this.lastProcessingTime = Date.now();
              this.queries = new Map<number, number | undefined>();
              this.scheduleBufferProcessing();
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
    this.processBufferTimeout = setTimeout(() => this.processBuffersIfNeeded(), 100);
  }

  private async updateQueries(): Promise<void> {
    const minutes = Array.from(this.buffers.keys());
    const start = Math.min(this.lastInsertedMinute, min(minutes) || this.lastInsertedMinute);
    const currentMinute = this.getCurrentMinute();

    if (start === currentMinute) {
      const currentMinuteBuffer = this.buffers.get(currentMinute);
      if (currentMinuteBuffer !== undefined) {
        const shouldProcessCurrentMinute =
          currentMinuteBuffer.length > 0 &&
          (currentMinuteBuffer.length <= MAX_VALUES_IN_CURRENT_MINUTE_FOR_INSTANT_PROCESS ||
            Date.now() - this.lastProcessingTime > WAIT_BETWEEN_BUFFER_PROCESS);
        if (shouldProcessCurrentMinute) {
          this.queries.set(currentMinute, this.getAverageSpeed(currentMinuteBuffer));
        }
      }
    } else {
      const valuesInDB = await getMinutesSpeedsSince(SQLITE_DB.Automate, start);
      const minutesToProcess = this.allMinutesInRange(start, currentMinute);
      minutesToProcess.forEach(m => {
        const minuteBuffer = this.buffers.get(m);
        this.buffers.delete(m);
        const dbValue = find(valuesInDB, v => v.minute === m);
        if (minuteBuffer !== undefined && minuteBuffer.length > 0) {
          this.queries.set(m, this.getAverageSpeed(minuteBuffer));
        } else if (!dbValue) {
          this.queries.set(m, undefined);
        }
      });

      const currentMinuteBuffer = this.buffers.get(currentMinute);
      if (currentMinuteBuffer !== undefined && currentMinuteBuffer.length > 0) {
        this.queries.set(currentMinute, this.getAverageSpeed(currentMinuteBuffer));
      }
    }
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
  private allMinutesInRange(start: number, end: number): number[] {
    if (start >= end) {
      return [];
    }
    let current = start;
    const minutes = [];
    while (current < end) {
      minutes.push(current);
      const currentDate = new Date(current);
      currentDate.setMinutes(currentDate.getMinutes() + 1);
      current = currentDate.getTime();
    }
    return minutes;
  }

  private getCurrentMinute(): number {
    const now = new Date();
    now.setSeconds(0);
    now.setMilliseconds(0);
    return now.getTime();
  }

  private getStartOfDay(): number {
    const now = new Date();
    now.setHours(0);
    now.setMinutes(0);
    now.setSeconds(0);
    now.setMilliseconds(0);
    return now.getTime();
  }

  public addSpeed(speed: number): void {
    const currentMinute = this.getCurrentMinute();
    const currentBuffer = this.buffers.get(currentMinute);
    if (currentBuffer) {
      currentBuffer.push(speed);
    } else {
      this.buffers.set(currentMinute, [speed]);
    }
  }
}

export const aggregator = new Aggregator();
