import * as React from 'react';
import styled from 'styled-components';

import {StatsChartForm} from '@root/components/apps/statistics/stats_chart_form';
import {StatsMetricDropdown} from '@root/components/apps/statistics/stats_metric_dropdown';
import {StatsPeriodDropdown} from '@root/components/apps/statistics/stats_period_dropdown';
import {StatsSummaryTable} from '@root/components/apps/statistics/stats_summary_table';
import {TimeBar} from '@root/components/apps/statistics/time_bar';
import {LoadingScreen} from '@root/components/core/loading_screen';
import {computeStatsData} from '@root/lib/statistics/data';
import {StatsMetric, METRAGE_METRIC, STOP_METRIC, DELAY_METRIC} from '@root/lib/statistics/metrics';
import {
  WEEK_STATS_PERIOD,
  StatsPeriod,
  MONTH_STATS_PERIOD,
  YEAR_STATS_PERIOD,
} from '@root/lib/statistics/period';
import {ScheduleStore} from '@root/stores/schedule_store';
import {Palette, Colors} from '@root/theme';

import {getWeekDay} from '@shared/lib/time';
import {Schedule, Operation} from '@shared/models';

interface StatisticsAppProps {}

interface StatisticsAppState {
  day?: number;
  schedule?: Schedule;
  operations?: Operation[];
  statsPeriod: StatsPeriod;
  statsMetric: StatsMetric;
}

const HOURS_IN_DAY = 24;
const MS_IN_DAY = HOURS_IN_DAY * 60 * 60 * 1000;

export class StatisticsApp extends React.Component<StatisticsAppProps, StatisticsAppState> {
  public static displayName = 'StatisticsApp';

  private readonly scheduleStore: ScheduleStore;

  public constructor(props: StatisticsAppProps) {
    super(props);
    this.state = {
      statsPeriod: MONTH_STATS_PERIOD,
      statsMetric: METRAGE_METRIC,
    };
    this.scheduleStore = new ScheduleStore({start: 0, end: Date.now() * 2});
  }

  public componentDidMount(): void {
    this.scheduleStore.refreshOnce(this.handleScheduleChanged);
  }

  private readonly handleScheduleChanged = (): void => {
    const schedule = this.scheduleStore.getSchedule();
    this.setState({schedule, operations: this.scheduleStore.getOperations()});
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
    const {schedule, operations, statsPeriod, statsMetric} = this.state;
    const currentDay = this.getCurrentDay();
    if (!schedule || !currentDay || !operations) {
      return <LoadingScreen />;
    }

    const statsData = computeStatsData(schedule);
    return (
      <StatisticWrapper>
        <DropdownBlock>
          <StatsMetricDropdown
            statsMetrics={[METRAGE_METRIC, STOP_METRIC, DELAY_METRIC]}
            selected={statsMetric}
            onChange={newStatsMetric => this.setState({statsMetric: newStatsMetric})}
          />
          <StatsPeriodDropdown
            statsPeriods={[WEEK_STATS_PERIOD, MONTH_STATS_PERIOD, YEAR_STATS_PERIOD]}
            selected={statsPeriod}
            onChange={newStatsPeriod => this.setState({statsPeriod: newStatsPeriod})}
          />
        </DropdownBlock>
        <Block>
          <TimeBar
            disableForward={!statsPeriod.canNavigate}
            disabledBackward={!statsPeriod.canNavigate}
            onForward={() => this.setState({day: statsPeriod.next(currentDay)})}
            onBackward={() => this.setState({day: statsPeriod.previous(currentDay)})}
          >
            {statsPeriod.renderPeriod(currentDay, schedule.prodHours)}
          </TimeBar>
        </Block>
        <ChartBlock>
          <StatsChartForm
            date={currentDay}
            prodHours={schedule.prodHours}
            operations={operations}
            statsData={statsData}
            statsMetric={statsMetric}
            statsPeriod={statsPeriod}
          />
        </ChartBlock>
        <Block>
          <StatsSummaryTable
            date={currentDay}
            prodHours={schedule.prodHours}
            operations={operations}
            statsData={statsData}
            statsMetric={statsMetric}
            statsPeriod={statsPeriod}
          />
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
  padding: 16px;
  flex-shrink: 0;
`;

const DropdownBlock = styled(Block)`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ChartBlock = styled(Block)`
  flex-grow: 1;
`;
