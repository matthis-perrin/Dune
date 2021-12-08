import * as React from 'react';
import {padNumber} from '@shared/lib/utils';

interface DurationProps {
  durationMs?: number;
}

const MS_IN_HOUR = 1000 * 60 * 60;
const MS_IN_MINUTE = 1000 * 60;
const MS_IN_SECONDS = 1000;
// const MS_DIGITS = 3;

export class Duration extends React.Component<DurationProps> {
  public static displayName = 'Duration';

  // private getDurationString(duration: number): string {
  //   if (duration === 0) {
  //     return 'Immédiat';
  //   }

  //   const hours = Math.floor(duration / MS_IN_HOUR);
  //   duration -= hours * MS_IN_HOUR;
  //   const minutes = Math.floor(duration / MS_IN_MINUTE);
  //   duration -= minutes * MS_IN_MINUTE;
  //   const seconds = Math.floor(duration / MS_IN_SECONDS);
  //   const milliseconds = duration - seconds * MS_IN_SECONDS;

  //   const hoursStr = hours > 0 ? `${hours} h` : '';
  //   const minutesStr = minutes > 0 ? `${this.padNumber(minutes, hours > 0 ? 2 : 1)} min` : '';
  //   const secondsStr =
  //     seconds > 0 ? `${this.padNumber(seconds, (minutes || hours) > 0 ? 2 : 1)} s` : '';
  //   const millisecondsStr = milliseconds > 0 ? `${this.padNumber(milliseconds, MS_DIGITS)} ms` : '';

  //   return `${hoursStr}${minutesStr}${secondsStr}${millisecondsStr}`;
  // }

  private getDurationStringV2(duration: number): string {
    const hours = Math.floor(duration / MS_IN_HOUR);
    duration -= hours * MS_IN_HOUR;
    const minutes = Math.floor(duration / MS_IN_MINUTE);
    duration -= minutes * MS_IN_MINUTE;
    const seconds = Math.floor(duration / MS_IN_SECONDS);

    const hoursStr = padNumber(hours, 2);
    const minutesStr = padNumber(minutes, 2);
    const secondsStr = padNumber(seconds, 2);

    return `${hoursStr}:${minutesStr}:${secondsStr}`;
  }

  public render(): JSX.Element {
    const {durationMs} = this.props;
    const durationStr = durationMs ? this.getDurationStringV2(durationMs) : '??:??:??';

    return <span>{durationStr}</span>;
  }
}
