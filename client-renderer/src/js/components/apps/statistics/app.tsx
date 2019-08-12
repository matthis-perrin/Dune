import * as React from 'react';
import styled from 'styled-components';

import {StatsChartForm} from '@root/components/apps/statistics/stats_chart_form';
import {TimeBar} from '@root/components/apps/statistics/time_bar';
import {WeekText} from '@root/components/apps/statistics/time_format';
import {LoadingScreen} from '@root/components/core/loading_screen';
import {computeStatsData} from '@root/lib/statistics';
import {ScheduleStore} from '@root/stores/schedule_store';
import {Palette, Colors} from '@root/theme';

import {getWeekDay} from '@shared/lib/time';
import {Schedule} from '@shared/models';

interface StatisticsAppProps {}

interface StatisticsAppState {
  day?: number;
  schedule?: Schedule;
}

const MS_IN_DAY = 24 * 60 * 60 * 1000;

export class StatisticsApp extends React.Component<StatisticsAppProps, StatisticsAppState> {
  public static displayName = 'StatisticsApp';

  private readonly scheduleStore: ScheduleStore;

  public constructor(props: StatisticsAppProps) {
    super(props);
    this.state = {};
    this.scheduleStore = new ScheduleStore({start: 0, end: Date.now() * 2});
  }

  public componentDidMount(): void {
    this.scheduleStore.refreshOnce(this.handleScheduleChanged);
  }

  private readonly handleScheduleChanged = (): void => {
    const schedule = this.scheduleStore.getSchedule();
    if (!schedule) {
      return;
    }
    this.setState({schedule});
  };

  private getFirstProdDayBeforeOrAtTime(schedule: Schedule, time: number): number {
    let currentTime = time;
    while (!schedule.prodHours.has(getWeekDay(new Date(currentTime)))) {
      currentTime -= MS_IN_DAY;
    }
    return currentTime;
  }

  private getCurrentDay(): number | undefined {
    const {day, schedule} = this.state;
    if (day) {
      return day;
    }
    if (schedule && schedule.lastSpeedTime) {
      return this.getFirstProdDayBeforeOrAtTime(schedule, schedule.lastSpeedTime.time - MS_IN_DAY);
    }
    return undefined;
  }

  public render(): JSX.Element {
    const {schedule} = this.state;
    const currentDay = this.getCurrentDay();
    if (!schedule || !currentDay) {
      return <LoadingScreen />;
    }

    const statsData = computeStatsData(schedule);
    return (
      <StatisticWrapper>
        <Block>
          <TimeBar>
            <WeekText prodHours={schedule.prodHours} ts={currentDay} />
          </TimeBar>
        </Block>
        <Block>
          <StatsChartForm date={currentDay} prodHours={schedule.prodHours} statsData={statsData} />
        </Block>
        <Block>
          {<pre>{JSON.stringify(Array.from(statsData.days.entries()), undefined, 2)}</pre>}
        </Block>
      </StatisticWrapper>
    );
  }
}

const padding = 8;

const StatisticWrapper = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  padding: ${padding}px ${padding}px 0 ${padding}px;
  background-color: ${Palette.Clouds};
`;

const Block = styled.div`
  background-color: ${Colors.PrimaryDark};
  margin-bottom: ${padding}px;
`;
