import * as React from 'react';
import styled from 'styled-components';

import {DayProductionTable} from '@root/components/common/day_production_table';
import {DayStats} from '@root/components/common/day_stats';
import {ScheduleView} from '@root/components/common/schedule';
import {LoadingIndicator} from '@root/components/core/loading_indicator';
import {SizeMonitor, SCROLLBAR_WIDTH} from '@root/components/core/size_monitor';
import {SVGIcon} from '@root/components/core/svg_icon';
import {getSchedulesForDay} from '@root/lib/schedule_utils';
import {
  MORNING_TEAM_FILTER,
  AFTERNOON_TEAM_FILTER,
  ALL_TEAM_FILTER,
} from '@root/lib/statistics/metrics';
import {numberWithSeparator} from '@root/lib/utils';
import {bobinesQuantitiesStore} from '@root/stores/data_store';
import {stocksStore, cadencierStore} from '@root/stores/list_store';
import {ScheduleStore} from '@root/stores/schedule_store';
import {Colors, Palette} from '@root/theme';

import {getPoseSize} from '@shared/lib/cliches';
import {getWeekDay} from '@shared/lib/time';
import {startOfDay, capitalize, endOfDay} from '@shared/lib/utils';
import {Stock, Schedule, BobineQuantities, Config} from '@shared/models';

interface ViewDayAppProps {
  initialDay: number;
  config: Config;
}

interface ViewDayAppState {
  day: number;
  schedule?: Schedule;
  cadencier?: Map<string, Map<number, number>>;
  bobineQuantities?: BobineQuantities[];
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

  private readonly handleStoresChanged = (): void => {
    this.setState({
      stocks: stocksStore.getStockIndex(),
      cadencier: cadencierStore.getCadencierIndex(),
      bobineQuantities: bobinesQuantitiesStore.getData(),
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
    const {config} = this.props;
    const {schedule, bobineQuantities, cadencier, day} = this.state;
    if (!schedule || !bobineQuantities || !cadencier) {
      return <React.Fragment />;
    }
    return (
      <ScheduleView
        day={new Date(day)}
        schedule={schedule}
        bobineQuantities={bobineQuantities}
        cadencier={cadencier}
        withContextMenu={config.hasGestionPlan}
        onPlanProdRefreshNeeded={() => this.scheduleStore.refresh()}
      />
    );
  }

  private renderProductionTable(width: number): JSX.Element {
    const {day, schedule, stocks} = this.state;
    if (schedule === undefined || stocks === undefined) {
      return <LoadingIndicator size="medium" />;
    }
    return (
      <div style={{display: 'flex', justifyContent: 'center'}}>
        <DayProductionTable day={day} schedule={schedule} stocks={stocks} width={width} />
      </div>
    );
  }

  private renderSummary(): JSX.Element {
    const {schedule, bobineQuantities, cadencier, day} = this.state;
    if (!schedule || !bobineQuantities || !cadencier) {
      return <React.Fragment />;
    }

    let totalBobines = 0;
    let totalMeters = 0;

    const schedules = getSchedulesForDay(schedule, new Date(day));
    schedules.forEach(s => {
      const bobines = s.planProd.data.bobines;
      const meters = s.doneProdMeters + s.plannedProdMeters;
      totalMeters += meters;
      const longueurFirstBobine = bobines.length > 0 ? bobines[0].longueur || 0 : 0;
      const tour = Math.round(meters / longueurFirstBobine);
      if (tour > 0) {
        bobines.forEach(b => {
          const pose = getPoseSize(b.pose);

          totalBobines += pose * tour;
        });
      }
    });

    return (
      <Summary>
        <SummaryLine>
          <SummaryLineLabel>Total bobines</SummaryLineLabel>
          <SummaryLineValue>{`x ${numberWithSeparator(totalBobines)}`}</SummaryLineValue>
        </SummaryLine>
        <SummaryLine>
          <SummaryLineLabel>Total mètres linéaires</SummaryLineLabel>
          <SummaryLineValue>{`${numberWithSeparator(Math.round(totalMeters))} m`}</SummaryLineValue>
        </SummaryLine>
      </Summary>
    );
  }

  public render(): JSX.Element {
    const {schedule, day} = this.state;
    return (
      <SizeMonitor>
        {width => (
          <AppWrapper>
            <TopBar>
              <NavigationIcon onClick={this.handlePreviousClick}>
                <SVGIcon name="caret-left" width={iconSize} height={iconSize} />
              </NavigationIcon>
              <TopBarTitle>{this.formatDay(this.state.day)}</TopBarTitle>
              <NavigationIcon onClick={this.handleNextClick}>
                <SVGIcon name="caret-right" width={iconSize} height={iconSize} />
              </NavigationIcon>
            </TopBar>

            <Bottom>
              <LeftColumn>
                <ScheduleBlock>
                  <BlockContent>
                    <ScheduleWrapper>{this.renderScheduleView()}</ScheduleWrapper>
                  </BlockContent>
                </ScheduleBlock>
              </LeftColumn>
              <RightColumn>
                <RightColumnInner>
                  {[MORNING_TEAM_FILTER, AFTERNOON_TEAM_FILTER, ALL_TEAM_FILTER].map(team => (
                    <Block>
                      <BlockTitle>{team.label}</BlockTitle>
                      <BlockContent>
                        <DayStats
                          day={day}
                          operations={this.scheduleStore.getOperations()}
                          schedule={schedule}
                          team={team}
                        />
                      </BlockContent>
                    </Block>
                  ))}
                  <Block>
                    <BlockTitle>Production du jour</BlockTitle>
                    <BlockContent>
                      {this.renderProductionTable(
                        // tslint:disable-next-line:no-magic-numbers
                        width - scheduleSize - 3 * blockSpacing - 4 * blockPadding + SCROLLBAR_WIDTH
                      )}
                    </BlockContent>
                  </Block>
                  <Block>
                    <BlockTitle>Résumé du jour</BlockTitle>
                    <BlockContent>{this.renderSummary()}</BlockContent>
                  </Block>
                </RightColumnInner>
              </RightColumn>
            </Bottom>
          </AppWrapper>
        )}
      </SizeMonitor>
    );
  }
}

const scheduleSize = 980;
const blockPadding = 16;
const blockSpacing = 8;
const iconSize = 16;

const AppWrapper = styled.div`
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  background-color: ${Palette.Clouds};
`;

// const TopBar = styled.div`
//   flex-shrink: 0;
//   width: 100%;
//   height: 48px;
//   display: flex;
//   align-items: center;
//   justify-content: space-between;
//   background-color: ${Colors.PrimaryDark};
//   color: ${Colors.TextOnPrimary};
// `;
const TopBar = styled.div`
  flex-shrink: 0;
  height: 64px;
  display: flex;
  justify-content: space-between;
  background-color: ${Colors.PrimaryDark};
  color: ${Colors.TextOnPrimary};
`;

const TopBarTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
`;

const NavigationIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  width: 48px;
  &:hover svg {
    fill: ${Palette.White};
  }
  svg {
    fill: ${Palette.Clouds};
  }
`;

const Bottom = styled.div`
  flex-grow: 1;
  display: flex;
`;

const LeftColumn = styled.div`
  width: 980px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  margin: ${blockSpacing}px;
`;

const RightColumn = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  height: calc(100% - ${2 * blockSpacing}px);
  margin: ${blockSpacing}px;
  margin-left: 0;
`;

const RightColumnInner = styled.div`
  display: flex;
  flex-direction: column;
  & > div {
    margin-bottom: ${blockSpacing}px;
    &:last-of-type {
      margin-bottom: 0;
    }
  }
`;

const Block = styled.div`
  display: flex;
  flex-direction: column;
`;

const BlockTitle = styled.div`
  flex-shrink: 0;
  background-color: ${Colors.SecondaryDark};
  color: ${Palette.White};
  text-transform: uppercase;
  padding: 4px 8px;
`;
const BlockContent = styled.div`
  flex-grow: 1;
  background-color: ${Colors.PrimaryLight};
  padding: ${blockPadding}px;
`;

const ScheduleWrapper = styled.div`
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  background-color: ${Palette.Clouds};
`;

const ScheduleBlock = styled(Block)`
  height: 100%;
`;

const Summary = styled.div`
  display: flex;
  flex-direction: column;
`;
const SummaryLine = styled.div`
  display: flex;
  align-items: center;
  color: ${Colors.TextOnSecondary};
  margin-bottom: 4px;
  &:last-of-type {
    margin-bottom: 0;
  }
`;
const SummaryLineLabel = styled.div`
  flex-grow: 1;
  margin-right: 4px;
  background-color: ${Colors.PrimaryDark};
  padding: 4px;
`;
const SummaryLineValue = styled.div`
  flex-shrink: 0;
  width: 100px;
  background-color: ${Colors.PrimaryDark};
  text-align: center;
  padding: 4px;
`;
