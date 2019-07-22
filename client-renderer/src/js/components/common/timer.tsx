import * as React from 'react';
import {padNumber} from '@root/lib/utils';

interface TimerProps {
  start: number;
  end?: number;
}

interface TimerState {
  durationMs: number;
}

const MS_IN_HOUR = 1000 * 60 * 60;
const MS_IN_MINUTE = 1000 * 60;
const MS_IN_SECONDS = 1000;

const REFRESH_INTERVAL = 500;

export class Timer extends React.PureComponent<TimerProps, TimerState> {
  public static displayName = 'Timer';
  private interval: number | undefined;

  public constructor(props: TimerProps) {
    super(props);
    this.state = this.getState();
  }

  public componentDidMount(): void {
    this.interval = setInterval(() => {
      this.setState(this.getState());
    }, REFRESH_INTERVAL);
  }

  public componentWillUnmount(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  private getState(): TimerState {
    const {start, end = Date.now()} = this.props;
    return {durationMs: end - start};
  }

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
    return <span>{this.renderDuration(this.state.durationMs)}</span>;
  }
}
