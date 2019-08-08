import * as React from 'react';

import {StopForm} from '@root/components/apps/stop/stop_form';
import {LoadingScreen} from '@root/components/core/loading_screen';
import {formatDuration, isSameDay} from '@root/lib/utils';
import {ScheduleStore} from '@root/stores/schedule_store';

import {startOfDay, endOfDay} from '@shared/lib/utils';
import {Stop, Schedule} from '@shared/models';

interface StopAppProps {
  day: number;
  stopStart: number;
}

interface StopAppState {
  stop?: Stop;
  schedule?: Schedule;
}

export class StopApp extends React.Component<StopAppProps, StopAppState> {
  public static displayName = 'StopApp';

  private readonly scheduleStore: ScheduleStore;

  public constructor(props: StopAppProps) {
    super(props);
    const date = new Date(props.day);
    const start = startOfDay(date).getTime();
    const end = endOfDay(date).getTime();
    this.scheduleStore = new ScheduleStore({start, end});
    this.state = {};
    this.updateWindowTitle();
  }

  public componentDidMount(): void {
    this.scheduleStore.start(this.handleScheduleChanged);
  }

  public componentWillUnmount(): void {
    this.scheduleStore.stop();
  }

  private readonly handleScheduleChanged = (): void => {
    const {stopStart, day} = this.props;
    const schedule = this.scheduleStore.getSchedule();
    if (!schedule) {
      return;
    }
    const stops = schedule.stops.filter(s => isSameDay(new Date(s.start), new Date(day)));
    const stop = stops.filter(s => s.start === stopStart)[0];
    this.setState({schedule, stop}, () => this.updateWindowTitle());
  };

  private updateWindowTitle(): void {
    const {stop} = this.state;
    if (stop === undefined) {
      document.title = 'Nouvel Arrêt';
    } else if (stop.end === undefined) {
      document.title = 'Arrêt en cours';
    } else {
      document.title = `Arrêt ${formatDuration(stop.end - stop.start)}`;
    }
  }

  public render(): JSX.Element {
    const {stop, schedule} = this.state;
    if (!stop || !schedule) {
      return <LoadingScreen />;
    }
    return <StopForm stop={stop} schedule={schedule} />;
  }
}
