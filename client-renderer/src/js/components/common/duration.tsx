import * as React from 'react';

interface DurationProps {
  durationMs: number;
}

const MS_IN_HOUR = 1000 * 60 * 60;
const MS_IN_MINUTE = 1000 * 60;
const MS_IN_SECONDS = 1000;

export class Duration extends React.Component<DurationProps> {
  public static displayName = 'Duration';

  private padNumber(value: number, padding: number): string {
    let valueStr = String(value);
    while (valueStr.length < padding) {
      valueStr = `0${valueStr}`;
    }
    return valueStr;
  }

  private getDurationString(duration: number): string {
    if (duration === 0) {
      return 'Immédiat';
    }

    const hours = Math.floor(duration / MS_IN_HOUR);
    duration -= hours * MS_IN_HOUR;
    const minutes = Math.floor(duration / MS_IN_MINUTE);
    duration -= minutes * MS_IN_MINUTE;
    const seconds = Math.floor(duration / MS_IN_SECONDS);
    const milliseconds = duration - seconds * MS_IN_SECONDS;

    const hoursStr = hours > 0 ? `${this.padNumber(hours, 2)}h` : '';
    const minutesStr = minutes > 0 ? `${this.padNumber(minutes, 2)}min` : '';
    const secondsStr = seconds > 0 ? `${this.padNumber(seconds, 2)}s` : '';
    const millisecondsStr = milliseconds > 0 ? `${this.padNumber(milliseconds, 3)}ms` : '';

    return `${hoursStr}${minutesStr}${secondsStr}${millisecondsStr}`;
  }

  public render(): JSX.Element {
    const {durationMs} = this.props;
    const durationStr = this.getDurationString(durationMs);

    return <span>{durationStr}</span>;
  }
}
