import React from 'react';
import styled from 'styled-components';

import {PlanProdViewer} from '@root/components/common/plan_prod_viewer';
import {LoadingScreen} from '@root/components/core/loading_screen';
import {bridge} from '@root/lib/bridge';
import {isSameDay} from '@root/lib/utils';
import {bobinesQuantitiesStore} from '@root/stores/data_store';
import {cadencierStore} from '@root/stores/list_store';
import {ScheduleStore} from '@root/stores/schedule_store';

import {startOfDay, endOfDay, arrayJoin} from '@shared/lib/utils';
import {BobineQuantities, Schedule, ScheduledPlanProd} from '@shared/models';

interface PlanProdPrinterAppProps {
  day: number;
}

interface PlanProdPrinterAppState {
  cadencier?: Map<string, Map<number, number>>;
  bobineQuantities?: BobineQuantities[];
  schedule?: Schedule;
}

export class PlanProdPrinterApp extends React.Component<
  PlanProdPrinterAppProps,
  PlanProdPrinterAppState
> {
  public static displayName = 'PlanProdPrinterApp';
  private readonly scheduleStore: ScheduleStore;
  private hasBeenSaved: boolean = false;

  public constructor(props: PlanProdPrinterAppProps) {
    super(props);
    const start = startOfDay(new Date(props.day)).getTime();
    const end = endOfDay(new Date(props.day)).getTime();
    this.state = {};
    this.scheduleStore = new ScheduleStore('Mondon', {start, end});
  }

  public componentDidMount(): void {
    cadencierStore.addListener(this.handleStoresChanged);
    bobinesQuantitiesStore.addListener(this.handleStoresChanged);
    this.scheduleStore.start(this.handleScheduleChange);
  }

  public componentWillUnmount(): void {
    cadencierStore.removeListener(this.handleStoresChanged);
    bobinesQuantitiesStore.removeListener(this.handleStoresChanged);
    this.scheduleStore.stop();
  }

  private readonly handleStoresChanged = (): void => {
    this.setState({
      cadencier: cadencierStore.getCadencierIndex(),
      bobineQuantities: bobinesQuantitiesStore.getData(),
    });
  };

  private readonly handleScheduleChange = (): void => {
    this.setState({
      schedule: this.scheduleStore.getSchedule(),
    });
  };

  public componentDidUpdate(): void {
    const {cadencier, bobineQuantities, schedule} = this.state;

    if (this.hasBeenSaved || !cadencier || !schedule || !bobineQuantities) {
      return;
    }
    this.hasBeenSaved = true;
    setTimeout(() => bridge.printAsPDF().finally(() => bridge.closeApp().catch(console.error)));
  }

  public render(): JSX.Element {
    const {day} = this.props;
    const {cadencier, bobineQuantities, schedule} = this.state;

    if (!cadencier || !schedule || !bobineQuantities) {
      return <LoadingScreen />;
    }

    const plans: ScheduledPlanProd[] = [];
    schedule.plans.forEach(p => {
      for (const time of Array.from(p.schedulePerDay.keys())) {
        if (isSameDay(new Date(time), new Date(day))) {
          plans.push(p);
          break;
        }
      }
    });

    return (
      <div>
        {arrayJoin(
          plans.map(p => (
            <PlanProdViewer
              key={p.planProd.id}
              bobineQuantities={bobineQuantities}
              cadencier={cadencier}
              hideOperationTable
              nonInteractive
              schedule={p}
              width={1100}
              forPrinting
            />
          )),
          <Separator />
        )}
      </div>
    );
  }
}

const Separator = styled.div`
  page-break-after: always;
`;
