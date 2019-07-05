import {getLastMinute} from '@shared/db/speed_minutes';

const WAIT_BETWEEN_BUFFER_FLUSH = 5000;

class Aggregator {
  private buffer = new Map<number, number[]>();

  constructor() {}

  public start(): void {}

  private flushBuffer(): void {
    setTimeout(() => this.flushBuffer(), WAIT_BETWEEN_BUFFER_FLUSH);
  }

  private currentMinute(): number {
    const now = new Date();
    now.setSeconds(0);
    now.setMilliseconds(0);
    return now.getTime();
  }

  public addSpeed(speed: number): void {
    // const lastMinute = await getLastMinute();
    // this.buffer.push({speed, time: Date.now()});
  }
}

export const aggregator = new Aggregator();
