import * as React from 'react';
import styled from 'styled-components';

import {StatsChartForm} from '@root/components/apps/statistics/stats_chart_form';
import {StatsMetricDropdown} from '@root/components/apps/statistics/stats_metric_dropdown';
import {StatsPeriodDropdown} from '@root/components/apps/statistics/stats_period_dropdown';
import {StatsSummaryTable} from '@root/components/apps/statistics/stats_summary_table';
import {TimeBar} from '@root/components/apps/statistics/time_bar';
import {computeStatsData, processStatsDataForDay} from '@root/lib/statistics/data';
import {
  METRAGE_METRIC,
  STOP_METRIC,
  DELAY_METRIC,
  MORNING_AFTERNOON_FILTERS,
} from '@root/lib/statistics/metrics';
import {
  WEEK_STATS_PERIOD,
  MONTH_STATS_PERIOD,
  YEAR_STATS_PERIOD,
} from '@root/lib/statistics/period';
import {ScheduleStore} from '@root/stores/schedule_store';
import {Palette, Colors} from '@root/theme';

import {Schedule, Operation} from '@shared/models';
import {startOfDay, endOfDay} from '@shared/lib/utils';
import {LoadingIndicator} from '@root/components/core/loading_indicator';

interface DayStatsProps {
  day: number;
  team: MetricFilter;
}

interface DayStatsState {
  schedule?: Schedule;
  operations?: Operation[];
}

export class DayStats extends React.Component<DayStatsProps, DayStatsState> {
  public static displayName = 'DayStats';

  private readonly scheduleStore: ScheduleStore;

  public constructor(props: DayStatsProps) {
    super(props);
    this.state = {};
    this.scheduleStore = new ScheduleStore({
      start: startOfDay(new Date(props.day)).getTime(),
      end: endOfDay(new Date(props.day)).getTime(),
    });
  }

  public componentDidMount(): void {
    this.scheduleStore.start(this.handleScheduleChanged);
  }

  private readonly handleScheduleChanged = (): void => {
    const schedule = this.scheduleStore.getSchedule();
    this.setState({schedule, operations: this.scheduleStore.getOperations()});
  };

  public render(): JSX.Element {
    const {day, team} = this.props;
    const {schedule, operations} = this.state;
    if (!schedule || !operations) {
      return <LoadingIndicator size="large" />;
    }

    const statsData = computeStatsData(schedule);
    const data = processStatsDataForDay(statsData, operations, day, METRAGE_METRIC, team);

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
