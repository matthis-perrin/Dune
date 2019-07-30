import * as React from 'react';

import {Calendar} from '@root/components/apps/main/gestion/calendar';
import {PlanProdTile} from '@root/components/apps/main/gestion/plan_prod_tile';
import {Page} from '@root/components/apps/main/page';
import {bridge} from '@root/lib/bridge';
import {contextMenuManager} from '@root/lib/context_menu';
import {getMinimumScheduleRangeForDate} from '@root/lib/schedule_utils';
import {dateIsAfterOrSameDay, startOfDay} from '@root/lib/utils';
import {bobinesQuantitiesStore} from '@root/stores/data_store';
import {stocksStore, cadencierStore} from '@root/stores/list_store';
import {ScheduleStore} from '@root/stores/schedule_store';

import {dateAtHour} from '@shared/lib/time';
import {Stock, BobineQuantities, ClientAppType, Schedule} from '@shared/models';

const LAST_MONTH = 11;

interface Props {}

interface State {
  stocks?: Map<string, Stock[]>;
  cadencier?: Map<string, Map<number, number>>;
  bobineQuantities?: BobineQuantities[];
  schedule?: Schedule;
  month: number;
  year: number;
}

export class GestionPage extends React.Component<Props, State> {
  public static displayName = 'GestionPage';
  private readonly scheduleStore: ScheduleStore;

  public constructor(props: Props) {
    super(props);
    const year = new Date().getFullYear();
    const month = new Date().getMonth();
    this.state = {month, year};
    const {start, end} = this.getProdStoreRange(year, month);
    this.scheduleStore = new ScheduleStore(start, end);
  }

  public componentDidMount(): void {
    stocksStore.addListener(this.handleStoresChanged);
    cadencierStore.addListener(this.handleStoresChanged);
    bobinesQuantitiesStore.addListener(this.handleStoresChanged);
    this.scheduleStore.start(this.handleStoresChanged);
  }

  public componentWillUnmount(): void {
    stocksStore.removeListener(this.handleStoresChanged);
    cadencierStore.removeListener(this.handleStoresChanged);
    bobinesQuantitiesStore.removeListener(this.handleStoresChanged);
    this.scheduleStore.stop();
  }

  private getProdStoreRange(year: number, month: number): {start: number; end: number} {
    const startDate = new Date(year, month - 1);
    const endDate = new Date(year, month + 1);
    return {start: startDate.getTime(), end: endDate.getTime()};
  }

  private readonly handleStoresChanged = (): void => {
    this.setState({
      stocks: stocksStore.getStockIndex(),
      cadencier: cadencierStore.getCadencierIndex(),
      bobineQuantities: bobinesQuantitiesStore.getData(),
      schedule: this.scheduleStore.getSchedule(),
    });
  };

  private readonly goToNextMonth = (): void => {
    const {year, month} = this.state;
    const newYear = month === LAST_MONTH ? year + 1 : year;
    const newMonth = month === LAST_MONTH ? 0 : month + 1;
    this.setState({year: newYear, month: newMonth});
    const {start, end} = this.getProdStoreRange(newYear, newMonth);
    this.scheduleStore.setRange(start, end);
  };

  private readonly goToPreviousMonth = (): void => {
    const {year, month} = this.state;
    const newYear = month === 0 ? year - 1 : year;
    const newMonth = month === 0 ? LAST_MONTH : month - 1;
    this.setState({year: newYear, month: newMonth});
    const {start, end} = this.getProdStoreRange(newYear, newMonth);
    this.scheduleStore.setRange(start, end);
  };

  private isValidDateToCreatePlanProd(date: Date): boolean {
    return dateIsAfterOrSameDay(date, new Date());
  }

  private getNewPlanProdIndexForDate(date: Date): number {
    const {schedule} = this.state;
    if (!schedule) {
      return 0;
    }
    const dayStart = startOfDay(date).getTime();
    const lastPlanBeforeOrAtDate = schedule.plans
      .filter(p => startOfDay(p.start).getTime() <= dayStart)
      .sort((p1, p2) => p2.start.getTime() - p1.start.getTime())[0];
    if (!lastPlanBeforeOrAtDate) {
      return 0;
    }
    return lastPlanBeforeOrAtDate.planProd.index + 1;
  }

  private readonly handleDayContextMenu = (event: React.MouseEvent, date: Date): void => {
    if (event.type === 'contextmenu' && this.isValidDateToCreatePlanProd(date)) {
      contextMenuManager
        .open([
          {
            label: `Nouveau plan de production le ${date.toLocaleDateString('fr')}`,
            callback: () => {
              const planProdIndex = this.getNewPlanProdIndexForDate(date);
              const {start, end} = getMinimumScheduleRangeForDate(date);
              bridge
                .createNewPlanProduction(planProdIndex)
                .then(({id}) => {
                  bridge
                    .openApp(ClientAppType.PlanProductionEditorApp, {
                      id,
                      isCreating: true,
                      start,
                      end,
                    })
                    .catch(console.error);
                })
                .catch(err => console.error(err));
            },
          },
        ])
        .catch(console.error);
    }
  };

  private readonly handleDayClick = (event: React.MouseEvent, date: Date): void => {
    bridge.viewDay(date.getTime()).catch(console.error);
  };

  private readonly handlePlanProdRefreshNeeded = (): void => {
    this.scheduleStore.refresh();
  };

  public renderDay(date: Date): JSX.Element {
    const {stocks, cadencier, bobineQuantities, schedule} = this.state;
    if (!stocks || !cadencier || !bobineQuantities || !schedule) {
      return <div />;
    }
    const startOfDay = dateAtHour(date, 0).getTime();
    return (
      <React.Fragment>
        {schedule.plans
          .filter(planSchedule => planSchedule.schedulePerDay.has(startOfDay))
          .map(plan => (
            <PlanProdTile
              key={plan.planProd.id}
              date={date}
              planSchedule={plan}
              schedule={schedule}
              stocks={stocks}
              cadencier={cadencier}
              bobineQuantities={bobineQuantities}
              onPlanProdRefreshNeeded={this.handlePlanProdRefreshNeeded}
            />
          ))}
      </React.Fragment>
    );
  }

  public render(): JSX.Element {
    const {month, year} = this.state;
    return (
      <Page>
        <Calendar
          month={month}
          year={year}
          onNextClick={this.goToNextMonth}
          onPreviousClick={this.goToPreviousMonth}
          onDayContextMenu={this.handleDayContextMenu}
          onDayClick={this.handleDayClick}
        >
          {(date: Date) => this.renderDay(date)}
        </Calendar>
      </Page>
    );
  }
}
