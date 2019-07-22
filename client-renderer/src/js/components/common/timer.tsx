import * as React from 'react';

import {AutoRefresh} from '@root/components/common/auto_refresh';
import {padNumber} from '@root/lib/utils';

interface TimerProps {
  start: number;
  end?: number;
}

const MS_IN_HOUR = 1000 * 60 * 60;
const MS_IN_MINUTE = 1000 * 60;
const MS_IN_SECONDS = 1000;

export class Timer extends React.PureComponent<TimerProps> {
  public static displayName = 'Timer';

  private renderDuration(duration: number): string {
    const hours = Math.floor(duration / MS_IN_HOUR);
    duration -= hours * MS_IN_HOUR;
    const minutes = Math.floor(duration / MS_IN_MINUTE);
    duration -= minutes * MS_IN_MINUTE;
    const seconds = Math.floor(duration / MS_IN_SECONDS);

    const minutesStr = padNumber(minutes, 2);
    const secondsStr = padNumber(seconds, 2);

    if (hours === 0) {
      return `${minutesStr}:${secondsStr}`;
    }

    const hoursStr = padNumber(hours, 2);
    return `${hoursStr}:${minutesStr}:${secondsStr}`;
  }

  public render(): JSX.Element {
    return (
      <AutoRefresh>
        {() => this.renderDuration((this.props.end || Date.now()) - this.props.start)}
      </AutoRefresh>
    );
  }
}
