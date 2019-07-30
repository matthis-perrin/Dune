import * as React from 'react';

import {StopForm} from '@root/components/apps/stop/stop_form';
import {LoadingScreen} from '@root/components/core/loading_screen';
import {getMinimumScheduleRangeForDate} from '@root/lib/schedule_utils';
import {formatDuration} from '@root/lib/utils';
import {ProdInfoStore} from '@root/stores/prod_info_store';
import {ScheduleStore} from '@root/stores/schedule_store';

import {ProdInfo, Stop, Schedule} from '@shared/models';

interface StopAppProps {
  day: number;
  stopStart: number;
}

interface StopAppState {
  prodInfo: ProdInfo;
  stop?: Stop;
  schedule?: Schedule;
}

export class StopApp extends React.Component<StopAppProps, StopAppState> {
  public static displayName = 'StopApp';

  private readonly prodInfoStore: ProdInfoStore;
  private readonly scheduleStore: ScheduleStore;

  public constructor(props: StopAppProps) {
    super(props);
    this.prodInfoStore = new ProdInfoStore(props.day);
    const {start, end} = getMinimumScheduleRangeForDate(new Date(props.day));
    this.scheduleStore = new ScheduleStore(start, end);
    this.state = {prodInfo: this.prodInfoStore.getState()};
    this.updateWindowTitle();
  }

  public componentDidMount(): void {
    this.prodInfoStore.addListener(this.handleProdInfoChanged);
    this.scheduleStore.start(this.handleScheduleChanged);
  }

  public componentWillUnmount(): void {
    this.prodInfoStore.addListener(this.handleProdInfoChanged);
    this.scheduleStore.stop();
  }

  private readonly handleProdInfoChanged = (): void => {
    const {stopStart} = this.props;
    const prodInfo = this.prodInfoStore.getState();
    const stop = prodInfo.stops.filter(s => s.start === stopStart)[0];
    this.setState({prodInfo, stop}, () => this.updateWindowTitle());
  };

  private readonly handleScheduleChanged = (): void => {
    this.setState({schedule: this.scheduleStore.getSchedule()});
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
