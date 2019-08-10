import * as React from 'react';
import styled from 'styled-components';

import {ScheduleView} from '@root/components/common/schedule';
import {SVGIcon} from '@root/components/core/svg_icon';
import {stocksStore} from '@root/stores/list_store';
import {ScheduleStore} from '@root/stores/schedule_store';
import {theme, Colors, Palette} from '@root/theme';

import {getWeekDay} from '@shared/lib/time';
import {startOfDay, capitalize, endOfDay} from '@shared/lib/utils';
import {Stock, Schedule} from '@shared/models';

interface ViewDayAppProps {
  initialDay: number;
}

interface ViewDayAppState {
  day: number;
  schedule?: Schedule;
  stocks?: Map<string, Stock[]>;
}

export class ViewDayApp extends React.Component<ViewDayAppProps, ViewDayAppState> {
  public static displayName = 'ViewDayApp';
  private readonly scheduleStore: ScheduleStore;

  public constructor(props: ViewDayAppProps) {
    super(props);
    this.state = {day: props.initialDay};
    const range = this.getDayRangeForDate(new Date(props.initialDay));
    this.scheduleStore = new ScheduleStore(range);
    document.title = this.formatDay(props.initialDay);
  }

  public componentDidMount(): void {
    stocksStore.addListener(this.handleStoresChanged);
    this.scheduleStore.start(this.handleStoresChanged);
  }

  public componentWillUnmount(): void {
    stocksStore.removeListener(this.handleStoresChanged);
    this.scheduleStore.stop();
  }

  private readonly handleStoresChanged = (): void => {
    this.setState({
      stocks: stocksStore.getStockIndex(),
      schedule: this.scheduleStore.getSchedule(),
    });
  };

  private getDayRangeForDate(date: Date): {start: number; end: number} {
    const start = startOfDay(date).getTime();
    const end = endOfDay(date).getTime();
    return {start, end};
  }

  private updateCurrentDay(newDay: Date): void {
    this.setState({day: newDay.getTime()});
    this.scheduleStore.setRange(this.getDayRangeForDate(newDay));
  }

  private readonly handlePreviousClick = (): void => {
    const newDay = new Date(this.state.day);
    const {schedule} = this.state;
    if (!schedule) {
      return;
    }
    newDay.setDate(newDay.getDate() - 1);
    while (schedule.prodHours.get(getWeekDay(newDay)) === undefined) {
      newDay.setDate(newDay.getDate() - 1);
    }
    this.updateCurrentDay(newDay);
  };

  private readonly handleNextClick = (): void => {
    const newDay = new Date(this.state.day);
    const {schedule} = this.state;
    if (!schedule) {
      return;
    }
    newDay.setDate(newDay.getDate() + 1);
    while (schedule.prodHours.get(getWeekDay(newDay)) === undefined) {
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

  private renderScheduleView(): JSX.Element {
    const {schedule, day, stocks} = this.state;
    if (!schedule) {
      return <React.Fragment />;
    }
    return (
      <ScheduleView
        day={new Date(day)}
        schedule={schedule}
        stocks={stocks}
        withContextMenu
        onPlanProdRefreshNeeded={() => this.scheduleStore.refresh()}
      />
    );
  }

  public render(): JSX.Element {
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
          <ScheduleWrapper>{this.renderScheduleView()}</ScheduleWrapper>
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
