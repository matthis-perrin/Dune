import * as React from 'react';
import styled from 'styled-components';

import {ScheduleView} from '@root/components/apps/view_day_app/schedule';
import {SVGIcon} from '@root/components/core/svg_icon';
import {getMinimumScheduleRangeForDate} from '@root/lib/schedule_utils';
import {capitalize} from '@root/lib/utils';
import {prodHoursStore} from '@root/stores/data_store';
import {stocksStore} from '@root/stores/list_store';
import {ScheduleStore} from '@root/stores/schedule_store';
import {theme, Colors, Palette} from '@root/theme';

import {getWeekDay} from '@shared/lib/time';
import {Stock, ProdRange, Schedule} from '@shared/models';

interface ViewDayAppProps {
  initialDay: number;
}

interface ViewDayAppState {
  day: number;
  schedule?: Schedule;
  stocks?: Map<string, Stock[]>;
  prodRanges?: Map<string, ProdRange>;
}

export class ViewDayApp extends React.Component<ViewDayAppProps, ViewDayAppState> {
  public static displayName = 'ViewDayApp';
  private readonly scheduleStore: ScheduleStore;

  public constructor(props: ViewDayAppProps) {
    super(props);
    this.state = {day: props.initialDay};
    const {start, end} = getMinimumScheduleRangeForDate(new Date(props.initialDay));
    this.scheduleStore = new ScheduleStore(start, end);
    document.title = this.formatDay(props.initialDay);
  }

  public componentDidMount(): void {
    stocksStore.addListener(this.handleStoresChanged);
    prodHoursStore.addListener(this.handleStoresChanged);
    this.scheduleStore.start(this.handleStoresChanged);
  }

  public componentWillUnmount(): void {
    stocksStore.removeListener(this.handleStoresChanged);
    prodHoursStore.removeListener(this.handleStoresChanged);
    this.scheduleStore.stop();
  }

  private readonly handleStoresChanged = (): void => {
    this.setState({
      stocks: stocksStore.getStockIndex(),
      prodRanges: prodHoursStore.getProdRanges(),
      schedule: this.scheduleStore.getSchedule(),
    });
  };

  private updateCurrentDay(newDay: Date): void {
    this.setState({day: newDay.getTime()});
    const {start, end} = getMinimumScheduleRangeForDate(newDay);
    this.scheduleStore.setRange(start, end);
  }

  private readonly handlePreviousClick = (): void => {
    const newDay = new Date(this.state.day);
    const prodRanges = prodHoursStore.getProdRanges();
    if (!prodRanges) {
      return;
    }
    newDay.setDate(newDay.getDate() - 1);
    while (prodRanges.get(getWeekDay(newDay)) === undefined) {
      newDay.setDate(newDay.getDate() - 1);
    }
    this.updateCurrentDay(newDay);
  };

  private readonly handleNextClick = (): void => {
    const newDay = new Date(this.state.day);
    const prodRanges = prodHoursStore.getProdRanges();
    if (!prodRanges) {
      return;
    }
    newDay.setDate(newDay.getDate() + 1);
    while (prodRanges.get(getWeekDay(newDay)) === undefined) {
      newDay.setDate(newDay.getDate() + 1);
    }
    this.updateCurrentDay(newDay);
  };

  private formatDay(ts: number): string {
    const date = new Date(ts);
    const dayOfWeek = capitalize(getWeekDay(date));
    const day = date.getDate();
    const month = date.toLocaleString('fr-FR', {month: 'long'});
    const year = date.getFullYear();
    return `${dayOfWeek} ${day} ${month} ${year}`;
  }

  public render(): JSX.Element {
    const {day, schedule, stocks, prodRanges} = this.state;

    return (
      <AppWrapper>
        <LeftColumn>
          <TopBar>
            <div onClick={this.handlePreviousClick}>
              <SVGIcon name="caret-left" width={12} height={12} />
            </div>
            {this.formatDay(this.state.day)}
            <div onClick={this.handleNextClick}>
              <SVGIcon name="caret-right" width={12} height={12} />
            </div>
          </TopBar>
          <ScheduleWrapper>
            <ScheduleView
              day={new Date(day)}
              schedule={schedule}
              stocks={stocks}
              prodRanges={prodRanges}
            />
          </ScheduleWrapper>
        </LeftColumn>
        <RightColumn>
          <div>Stats</div>
          <div>Prod</div>
          <div>Chart</div>
        </RightColumn>
      </AppWrapper>
    );
  }
}

const AppWrapper = styled.div`
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background-color: ${theme.page.backgroundColor};
`;

const LeftColumn = styled.div`
  width: 980px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
`;

const TopBar = styled.div`
  flex-shrink: 0;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: ${Colors.PrimaryDark};
  color: ${Colors.TextOnPrimary};
`;

const ScheduleWrapper = styled.div`
  flex-grow: 1;
  overflow-x: hidden;
  overflow-y: auto;
  background-color: ${Palette.Clouds};
`;

const RightColumn = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  background-color: ${Colors.PrimaryLight};
`;
