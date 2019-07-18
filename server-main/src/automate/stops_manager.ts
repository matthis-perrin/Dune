import {SQLITE_DB} from '@root/db';
import {addError} from '@root/state';

import {firstSpeedMatchingSince, getLastMinute} from '@shared/db/speed_minutes';
import {getLastStop, insertOrUpdateStop} from '@shared/db/speed_stops';

const WAIT_BETWEEN_PROCESS = 1000;
const SPEED_THRESHOLD_FOR_STOP = 50;

class StopsManager {
  private async analyseStops(): Promise<boolean> {
    const lastStop = await getLastStop(SQLITE_DB.Automate);
    const lastMinuteSpeed = await getLastMinute(SQLITE_DB.Automate);
    const lastMinute = lastMinuteSpeed === undefined ? 0 : lastMinuteSpeed.minute;
    if (lastStop === undefined || (lastStop.end !== undefined && lastStop.end < lastMinute)) {
      const nextStopStart = await firstSpeedMatchingSince(
        SQLITE_DB.Automate,
        lastStop ? lastStop.end || 0 : 0,
        '<',
        SPEED_THRESHOLD_FOR_STOP
      );
      if (!nextStopStart || nextStopStart.minute === lastMinute) {
        return false;
      }
      await insertOrUpdateStop(SQLITE_DB.Automate, nextStopStart.minute);
      return true;
    } else if (lastStop.start < lastMinute) {
      const nextStopEnd = await firstSpeedMatchingSince(
        SQLITE_DB.Automate,
        lastStop.start,
        '>=',
        SPEED_THRESHOLD_FOR_STOP
      );
      if (!nextStopEnd || nextStopEnd.minute === lastMinute) {
        return false;
      }
      await insertOrUpdateStop(SQLITE_DB.Automate, lastStop.start, nextStopEnd.minute);
      return true;
    }
    return false;
  }

  private process(): void {
    this.analyseStops()
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
