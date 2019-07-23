import * as React from 'react';

import {StopForm} from '@root/components/apps/stop/stop_form';
import {LoadingScreen} from '@root/components/core/loading_screen';
import {formatDuration} from '@root/lib/utils';
import {ProdInfoStore} from '@root/stores/prod_info_store';

import {ProdInfo, Stop} from '@shared/models';

interface StopAppProps {
  day: number;
  stopStart: number;
}

interface StopAppState {
  prodInfo: ProdInfo;
  stop?: Stop;
}

export class StopApp extends React.Component<StopAppProps, StopAppState> {
  public static displayName = 'StopApp';

  private readonly prodInfoStore: ProdInfoStore;

  public constructor(props: StopAppProps) {
    super(props);
    this.prodInfoStore = new ProdInfoStore(props.day);
    this.state = {prodInfo: this.prodInfoStore.getState()};
    this.updateWindowTitle();
  }

  public componentDidMount(): void {
    this.prodInfoStore.addListener(this.handleProdInfoChanged);
  }

  public componentWillUnmount(): void {
    this.prodInfoStore.addListener(this.handleProdInfoChanged);
  }

  private readonly handleProdInfoChanged = (): void => {
    const {stopStart} = this.props;
    const prodInfo = this.prodInfoStore.getState();
    const stop = prodInfo.stops.filter(s => s.start === stopStart)[0];
    this.setState({prodInfo, stop}, () => this.updateWindowTitle());
  };

  private updateWindowTitle(): void {
    const {stop} = this.state;
    if (stop == undefined) {
      document.title = 'Nouvel Arrêt';
    } else if (stop.end === undefined) {
      document.title = 'Arrêt en cours';
    } else {
      document.title = `Arrêt ${formatDuration(stop.end - stop.start)}`;
    }
  }

  public render(): JSX.Element {
    const {stop} = this.state;
    if (!stop) {
      return <LoadingScreen />;
    }
    return <StopForm stop={stop} />;
  }
}
