import * as React from 'react';
import styled from 'styled-components';

import {Calendar} from '@root/components/apps/main/gestion/calendar';
import {PlanProdTile} from '@root/components/apps/main/gestion/plan_prod_tile';
import {Page} from '@root/components/apps/main/page';
import {bridge} from '@root/lib/bridge';
import {showDayContextMenu} from '@root/lib/day_context_menu';
import {bobinesQuantitiesStore} from '@root/stores/data_store';
import {stocksStore, cadencierStore} from '@root/stores/list_store';
import {ScheduleStore} from '@root/stores/schedule_store';
import {FontWeight, Palette} from '@root/theme';

import {dateAtHour} from '@shared/lib/time';
import {startOfDay, padNumber} from '@shared/lib/utils';
import {Stock, BobineQuantities, Schedule, Config, ProdRange, StopType, Stop} from '@shared/models';

const LAST_MONTH = 11;

interface Props {
  config: Config;
}

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
    this.scheduleStore = new ScheduleStore({start, end});
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
    this.scheduleStore.setRange({start, end});
  };

  private readonly goToPreviousMonth = (): void => {
    const {year, month} = this.state;
    const newYear = month === 0 ? year - 1 : year;
    const newMonth = month === 0 ? LAST_MONTH : month - 1;
    this.setState({year: newYear, month: newMonth});
    const {start, end} = this.getProdStoreRange(newYear, newMonth);
    this.scheduleStore.setRange({start, end});
  };

  private readonly handleDayContextMenu = (event: React.MouseEvent, date: Date): void => {
    const {config} = this.props;
    const schedule = this.scheduleStore.getSchedule();
    if (event.type === 'contextmenu' && schedule !== undefined && config.hasGestionPlan) {
      showDayContextMenu(schedule, date, () => this.scheduleStore.refresh());
    }
  };

  private readonly handleDayDoubleClick = (event: React.MouseEvent, date: Date): void => {
    bridge.viewDay(date.getTime()).catch(console.error);
  };

  private readonly handlePlanProdRefreshNeeded = (): void => {
    this.scheduleStore.refresh();
  };

  private getProdRange(
    date: Date,
    prodHours: Map<string, ProdRange>
  ): {start: number; end: number} {
    const dayOfWeek = date.toLocaleString('fr-FR', {weekday: 'long'});
    const prodRange = prodHours.get(dayOfWeek);
    if (!prodRange) {
      const defaultStartHour = 1;
      const defaultEndHour = 23;
      return {
        start: dateAtHour(date, defaultStartHour).getTime(),
        end: dateAtHour(date, defaultEndHour).getTime(),
      };
    }
    return {
      start: dateAtHour(date, prodRange.startHour, prodRange.startMinute).getTime(),
      end: dateAtHour(date, prodRange.endHour, prodRange.endMinute).getTime(),
    };
  }

  private renderSmallDuration(start: number, end: number): string {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const duration = end - start;
    const durationHours = Math.floor(duration / (3600 * 1000));
    const durationMinutes = Math.round((duration - durationHours * 3600 * 1000) / (60 * 1000));
    return `de ${startDate.getHours()}h${padNumber(
      startDate.getMinutes(),
      2
    )} à ${endDate.getHours()}h${padNumber(endDate.getMinutes(), 2)} (${durationHours}h${padNumber(
      durationMinutes,
      2
    )})`;
  }

  private renderMaintenance(id: number, title: string, start: number, end: number): JSX.Element {
    return (
      <MaintenanceTile>
        <div>{`Maintenance (${title})`}</div>
        <div>{this.renderSmallDuration(start, end)}</div>
      </MaintenanceTile>
    );
  }

  private renderNonProd(id: number, title: string, start: number, end: number): JSX.Element {
    return (
      <NonProdTile>
        <div>{`Période sans équipes (${title})`}</div>
        <div>{this.renderSmallDuration(start, end)}</div>
      </NonProdTile>
    );
  }

  private renderDay(date: Date): JSX.Element {
    const {config} = this.props;
    const {stocks, cadencier, bobineQuantities, schedule} = this.state;
    if (!stocks || !cadencier || !bobineQuantities || !schedule) {
      return <div />;
    }
    const dayStart = startOfDay(date).getTime();
    const {start, end} = this.getProdRange(date, schedule.prodHours);

    const maintenances = schedule.maintenances.filter(m => m.start >= start && m.start < end);
    const nonProds = schedule.nonProds.filter(np => np.start >= start && np.start < end);

    const headerTiles = new Map<number, JSX.Element>();

    maintenances.forEach(m =>
      headerTiles.set(
        m.start,
        this.renderMaintenance(m.id, m.title || '', m.start, m.end || m.start)
      )
    );
    nonProds.forEach(np =>
      headerTiles.set(
        np.start,
        this.renderNonProd(np.id, np.title || '', np.start, np.end || np.start)
      )
    );

    return (
      <React.Fragment>
        <div>
          {Array.from(headerTiles.entries())
            .sort((a, b) => a[0] - b[0])
            .map(e => e[1])}
        </div>
        <div>
          {schedule.plans
            .filter(planSchedule => planSchedule.schedulePerDay.has(dayStart))
            .map(plan => (
              <PlanProdTile
                config={config}
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
        </div>
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
          onDayDoubleClick={this.handleDayDoubleClick}
        >
          {(date: Date) => this.renderDay(date)}
        </Calendar>
      </Page>
    );
  }
}

const hMargin = 4;
const vMargin = 8;

const TileWrapper = styled.div`
  position: relative;
  width: calc(100% - ${2 * hMargin}px);
  box-sizing: border-box;
  margin: 0 ${hMargin}px ${vMargin}px ${hMargin}px;
  padding: 4px 8px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  border: solid 1px black;
  font-weight: ${FontWeight.SemiBold};
  background-color: ${Palette.Silver};
`;

const MaintenanceTile = styled(TileWrapper)``;
const NonProdTile = styled(TileWrapper)``;
