import React from 'react';
import styled from 'styled-components';

import {StopList} from '@root/components/apps/production/stop_list';
import {SpeedChartEvent, SpeedChart} from '@root/components/charts/speed_chart';
import {DayStats} from '@root/components/common/day_stats';
import {LoadingIndicator} from '@root/components/core/loading_indicator';
import {SizeMonitor} from '@root/components/core/size_monitor';
import {WithConstants} from '@root/components/core/with_constants';
import {isProdHourNonProd, getMidDay, computeStatsData, aggregate} from '@root/lib/statistics/data';
import {
  MORNING_TEAM_FILTER,
  AFTERNOON_TEAM_FILTER,
  ALL_TEAM_FILTER,
  getMetrages,
  UNPLANNED_STOP_FILTER,
  PLANNED_STOP_FILTER,
  MAINTENANCE_STOP_FILTER,
  NON_PROD_STOP_FILTER,
  PROD_STOP_FILTER,
  getStops,
  getDelays,
} from '@root/lib/statistics/metrics';
import {getColorForStopType} from '@root/lib/stop';
import {isSameDay, numberWithSeparator, formatDuration} from '@root/lib/utils';
import {Colors, Palette, FontWeight} from '@root/theme';

import {getWeekDay} from '@shared/lib/time';
import {capitalize, startOfDay} from '@shared/lib/utils';
import {ProdInfo, Schedule, Operation, StopType, Stock, Constants} from '@shared/models';

interface ReportViewerProps {
  schedule: Schedule;
  operations: Operation[];
  day: number;
  stocks: Map<string, Stock[]>;
  prodInfo: ProdInfo;
}

export class ReportViewer extends React.Component<ReportViewerProps> {
  public static displayName = 'ReportViewer';

  private renderTitle(): JSX.Element {
    const date = new Date(this.props.day);
    const dayOfWeek = capitalize(getWeekDay(date));
    const day = date.getDate();
    const month = date.toLocaleString('fr-FR', {month: 'long'});
    const year = date.getFullYear();
    return <TitleContainer>{`Rapport du ${dayOfWeek} ${day} ${month} ${year}`}</TitleContainer>;
  }

  private renderSummary(constants: Constants): JSX.Element {
    const {day, schedule, operations} = this.props;
    const dataDay = startOfDay(new Date(day)).getTime();
    const statsData = computeStatsData(schedule);

    const metrageDone = aggregate(statsData, dataDay, 'sum', dayStatsData =>
      getMetrages(dayStatsData, 'all')
    );

    const [unplannedDone, plannedDone, maintenanceDone, nonProdDone, prodDone] = [
      UNPLANNED_STOP_FILTER.name,
      PLANNED_STOP_FILTER.name,
      MAINTENANCE_STOP_FILTER.name,
      NON_PROD_STOP_FILTER.name,
      PROD_STOP_FILTER.name,
    ].map(stopFilter =>
      aggregate(statsData, dataDay, 'sum', dayStatsData =>
        getStops(dayStatsData, 'all', stopFilter)
      )
    );

    const stopDone = unplannedDone + plannedDone + maintenanceDone + nonProdDone;
    const activePeriod = stopDone + prodDone;
    const activePeriodMetrage = (activePeriod * constants.maxSpeed) / (60 * 1000);

    const delays = aggregate(statsData, dataDay, 'sum', dayStatsData =>
      getDelays(dayStatsData, operations, constants, 'all', 'all')
    );

    const perf =
      activePeriodMetrage > 0 ? Math.round((1000 * metrageDone) / activePeriodMetrage) / 10 : 0;

    // let totalBobines = 0;
    // const schedules = getSchedulesForDay(schedule, new Date(day));
    // schedules.forEach(s => {
    //   const bobines = s.planProd.data.bobines;
    //   const meters = s.doneProdMeters + s.plannedProdMeters;
    //   const longueurFirstBobine = bobines.length > 0 ? bobines[0].longueur || 0 : 0;
    //   const tour = Math.round(meters / longueurFirstBobine);
    //   if (tour > 0) {
    //     bobines.forEach(b => {
    //       const pose = getPoseSize(b.pose);
    //       totalBobines += pose * tour;
    //     });
    //   }
    // });

    return (
      <SummaryContainer>
        <SummaryValue>{`Perf: ${perf}%`}</SummaryValue>
        <SummaryValue>{`Métrage Linéaire: ${numberWithSeparator(
          Math.round(metrageDone)
        )} m`}</SummaryValue>
        {/* <SummaryValue>{`Production théorique: ${numberWithSeparator(
          Math.round(totalBobines)
        )} bobines`}</SummaryValue> */}
        <SummaryValue>{`Retard: ${formatDuration(delays)}`}</SummaryValue>
      </SummaryContainer>
    );
  }

  private renderChart(): JSX.Element {
    const {schedule, prodInfo, day} = this.props;

    const prodRanges = schedule.prodHours;
    const prodRange = prodRanges.get(getWeekDay(new Date(day))) || {
      startHour: 0,
      startMinute: 0,
      endHour: 23,
      endMinute: 59,
    };

    const events: SpeedChartEvent[] = [];
    schedule.plans.forEach(p =>
      p.schedulePerDay.forEach(s =>
        s.stops.forEach(stop => {
          const eventEnd =
            stop.end !== undefined
              ? stop.end
              : schedule.lastSpeedTime !== undefined
              ? schedule.lastSpeedTime.time
              : undefined;
          if (eventEnd !== undefined) {
            events.push({
              start: stop.start,
              end: eventEnd,
              color: getColorForStopType(stop.stopType),
            });
          }
        })
      )
    );

    return (
      <CharContainer>
        <SpeedChart
          day={day}
          lastTimeSpeed={schedule.lastSpeedTime}
          prodRange={prodRange}
          speeds={prodInfo.speedTimes}
          events={events}
        />
      </CharContainer>
    );
  }

  private renderPerfs(): JSX.Element {
    const {schedule, operations, day} = this.props;

    return (
      <PerfContainer>
        {[MORNING_TEAM_FILTER, AFTERNOON_TEAM_FILTER, ALL_TEAM_FILTER].map(team => (
          <PerfBlock key={team.name}>
            <PerfBlockTitle>{team.label}</PerfBlockTitle>
            <DayStats day={day} operations={operations} schedule={schedule} team={team} />
          </PerfBlock>
        ))}
      </PerfContainer>
    );
  }

  private renderStops(): JSX.Element {
    const {schedule, day} = this.props;
    const lastMinute =
      (schedule && schedule.lastSpeedTime && schedule.lastSpeedTime.time) || Date.now();

    const dayStops = schedule.stops
      .filter(s => s.stopType !== StopType.NotProdHours || !isProdHourNonProd(s.title))
      .filter(s => isSameDay(new Date(s.start), new Date(day)))
      .sort((s1, s2) => s1.start - s2.start);

    const midDay = getMidDay(schedule, day);
    const morningStops = dayStops.filter(s => s.start < midDay);
    const afternoonStops = dayStops.filter(s => s.start >= midDay);
    return (
      <StopsContainer>
        <StopsBlock>
          <StopBlockTitle>Stops du matin</StopBlockTitle>
          <StopBlockContent>
            <StopList forReport schedule={schedule} lastMinute={lastMinute} stops={morningStops} />
          </StopBlockContent>
        </StopsBlock>
        <StopsBlock>
          <StopBlockTitle>Stops du soir</StopBlockTitle>
          <StopBlockContent>
            <StopList
              forReport
              schedule={schedule}
              lastMinute={lastMinute}
              stops={afternoonStops}
            />
          </StopBlockContent>
        </StopsBlock>
      </StopsContainer>
    );
  }

  // private renderProductionTable(): JSX.Element {
  //   const {day, schedule, stocks} = this.props;
  //   return (
  //     <ProductionTableContainer>
  //       <DayProductionTable day={day} schedule={schedule} stocks={stocks} width={600} />
  //     </ProductionTableContainer>
  //   );
  // }

  public render(): JSX.Element {
    return (
      <SizeMonitor>
        {width => (
          <WithConstants>
            {constants => {
              if (!constants) {
                return <LoadingIndicator size="large" />;
              }
              let scale = width < REPORT_WIDTH ? width / REPORT_WIDTH : 1;
              // tslint:disable-next-line: no-magic-numbers
              if (width < 600) {
                // tslint:disable-next-line: no-magic-numbers
                scale = 0.88; // 0.59
              }
              const scalingStyles: React.CSSProperties = {
                transformOrigin: 'left top',
                transform: `scale(${scale})`,
              };
              return (
                <ReportWrapper style={scalingStyles}>
                  {this.renderTitle()}
                  {this.renderSummary(constants)}
                  <ReportSectionTitle>Historique des vitesses</ReportSectionTitle>
                  {this.renderChart()}
                  <ReportSectionTitle>Performance de la journée</ReportSectionTitle>
                  {this.renderPerfs()}
                  <ReportSectionTitle>Détail des arrêts</ReportSectionTitle>
                  {this.renderStops()}
                  {/* <ReportSectionTitle>Production de la journée (théorique)</ReportSectionTitle>
                  {this.renderProductionTable()} */}
                </ReportWrapper>
              );
            }}
          </WithConstants>
        )}
      </SizeMonitor>
    );
  }
}

const REPORT_WIDTH = 1200;

const ReportWrapper = styled.div`
  min-width: ${REPORT_WIDTH}px;
  display: flex;
  flex-direction: column;
  border-bottom: solid 2px ${Colors.PrimaryDark};
  @media print {
    width: 100%;
  }
`;

const ReportSectionTitle = styled.div`
  box-sizing: border-box;
  padding: 8px 16px;
  background-color: ${Colors.PrimaryDark};
  color: ${Colors.TextOnPrimary};
`;

const Container = styled.div`
  border-left: solid 2px ${Colors.PrimaryDark};
  border-right: solid 2px ${Colors.PrimaryDark};
  background-color: ${Palette.White};
`;

const TitleContainer = styled.div`
  width: auto;
  align-self: flex-start;
  font-size: 20px;
  padding: 8px 16px;
  background-color: ${Colors.PrimaryDark};
  color: ${Colors.TextOnPrimary};
`;

const SummaryContainer = styled(Container)`
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  border-top: solid 2px ${Colors.PrimaryDark};
`;
const SummaryValue = styled.div`
  font-size: 24px;
  font-weight: ${FontWeight.SemiBold};
  color: ${Colors.PrimaryDark};
`;

const CharContainer = styled(Container)`
  height: 200px;
  padding: 16px 16px 0 0;
  .plottable .axis text {
    fill: ${Colors.PrimaryDark}!important;
  }
`;

const PerfContainer = styled(Container)`
  display: flex;
  justify-content: space-evenly;
  padding: 8px 0 16px 0;
`;
const PerfBlock = styled.div``;
const PerfBlockTitle = styled.div`
  font-size: 20px;
  font-weight: ${FontWeight.SemiBold};
  margin-bottom: 8px;
  color: ${Colors.PrimaryDark};
`;

const StopsContainer = styled(Container)`
  display: flex;
  padding: 16px;
`;
const StopsBlock = styled.div`
  flex-grow: 1;
  flex-basis: 1px;
  margin-right: 16px;
  &:last-of-type {
    margin-right: 0;
  }
`;
const StopBlockTitle = styled.div`
  font-size: 20px;
  font-weight: ${FontWeight.SemiBold};
  margin-bottom: 8px;
  color: ${Colors.PrimaryDark};
`;
const StopBlockContent = styled.div``;

// const ProductionTableContainer = styled(Container)`
//   display: flex;
//   justify-content: center;
//   padding: 16px;
// `;
