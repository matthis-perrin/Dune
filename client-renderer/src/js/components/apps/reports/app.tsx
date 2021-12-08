import * as React from 'react';
import styled from 'styled-components';

import {ReportViewer} from '@root/components/common/report_viewer';
import {Button} from '@root/components/core/button';
import {LoadingIndicator} from '@root/components/core/loading_indicator';
import {SVGIcon} from '@root/components/core/svg_icon';
import {bridge} from '@root/lib/bridge';
import {bobinesQuantitiesStore} from '@root/stores/data_store';
import {cadencierStore, stocksStore} from '@root/stores/list_store';
import {ProdInfoStore} from '@root/stores/prod_info_store';
import {ScheduleStore} from '@root/stores/schedule_store';
import {Colors, Palette} from '@root/theme';

import {getWeekDay} from '@shared/lib/time';
import {startOfDay, endOfDay, capitalize} from '@shared/lib/utils';
import {ProdInfo, Schedule, BobineQuantities, Stock} from '@shared/models';

interface ReportsAppProps {
  initialDay?: number;
}

interface ReportsAppState {
  day?: Date;
  schedule?: Schedule;
  cadencier?: Map<string, Map<number, number>>;
  bobineQuantities?: BobineQuantities[];
  stocks?: Map<string, Stock[]>;
  prodInfo?: ProdInfo;
}

export class ReportsApp extends React.Component<ReportsAppProps, ReportsAppState> {
  public static displayName = 'ReportsApp';

  private readonly scheduleStore: ScheduleStore;
  private prodInfoStore: ProdInfoStore | undefined;

  public constructor(props: ReportsAppProps) {
    super(props);
    let range: {start: number; end: number} | undefined;
    if (props.initialDay) {
      const date = new Date(props.initialDay);
      range = {start: startOfDay(date).getTime(), end: endOfDay(date).getTime()};
      this.state = {day: date};
    } else {
      this.state = {};
    }
    this.scheduleStore = new ScheduleStore(range);
  }

  public componentDidMount(): void {
    cadencierStore.addListener(this.handleStoresChanged);
    bobinesQuantitiesStore.addListener(this.handleStoresChanged);
    stocksStore.addListener(this.handleStoresChanged);
    this.scheduleStore.start(this.handleScheduleChanged);
  }

  public componentWillUnmount(): void {
    cadencierStore.removeListener(this.handleStoresChanged);
    bobinesQuantitiesStore.removeListener(this.handleStoresChanged);
    stocksStore.removeListener(this.handleStoresChanged);
    if (this.prodInfoStore) {
      this.prodInfoStore.removeListener(this.handleProdInfoChanged);
    }
    this.scheduleStore.stop();
  }

  private readonly handleStoresChanged = (): void => {
    this.setState({
      cadencier: cadencierStore.getCadencierIndex(),
      bobineQuantities: bobinesQuantitiesStore.getData(),
      stocks: stocksStore.getStockIndex(),
    });
  };

  private readonly handleScheduleChanged = (): void => {
    const schedule = this.scheduleStore.getSchedule();
    this.setState({schedule});
    if (!schedule) {
      return;
    }
    const currentDay = this.getCurrentDay();
    if (currentDay) {
      const dayTs = currentDay.getTime();
      if (!this.prodInfoStore) {
        this.prodInfoStore = new ProdInfoStore(dayTs);
        this.prodInfoStore.addListener(this.handleProdInfoChanged);
      }
    }
  };

  private readonly handleProdInfoChanged = (): void => {
    if (this.prodInfoStore) {
      const prodInfo = this.prodInfoStore.getState();
      this.setState({prodInfo});
    }
  };

  private changeDay(newDay: number): void {
    const newDayDate = new Date(newDay);
    const start = startOfDay(newDayDate).getTime();
    const end = endOfDay(newDayDate).getTime();
    this.scheduleStore.setRange({start, end});
    if (this.prodInfoStore) {
      this.prodInfoStore.setDay(start);
    }
    this.setState({day: newDayDate});
    document.title = this.getWindowTitle(newDay);
  }

  private getCurrentDay(): Date | undefined {
    const {schedule, day} = this.state;
    if (day) {
      return day;
    }
    if (!schedule) {
      const {initialDay} = this.props;
      return initialDay !== undefined ? startOfDay(new Date(initialDay)) : undefined;
    }
    return schedule.lastSpeedTime === undefined
      ? new Date()
      : startOfDay(new Date(schedule.lastSpeedTime.time));
  }

  private readonly handlePreviousClick = (): void => {
    const {schedule} = this.state;
    const currentDay = this.getCurrentDay();
    if (!schedule || !currentDay) {
      return;
    }
    const prodHours = schedule.prodHours;
    currentDay.setDate(currentDay.getDate() - 1);
    while (prodHours.get(getWeekDay(currentDay)) === undefined) {
      currentDay.setDate(currentDay.getDate() - 1);
    }
    this.changeDay(currentDay.getTime());
  };

  private readonly handleNextClick = (): void => {
    const {schedule} = this.state;
    const currentDay = this.getCurrentDay();
    if (!schedule || !currentDay) {
      return;
    }
    const prodHours = schedule.prodHours;
    currentDay.setDate(currentDay.getDate() + 1);
    while (prodHours.get(getWeekDay(currentDay)) === undefined) {
      currentDay.setDate(currentDay.getDate() + 1);
    }
    this.changeDay(currentDay.getTime());
  };

  private getWindowTitle(ts: number): string {
    return `Rapport - ${this.formatDay(ts)}`;
  }

  private formatDay(ts: number): string {
    const date = new Date(ts);
    const dayOfWeek = capitalize(getWeekDay(date));
    const day = date.getDate();
    const month = date.toLocaleString('fr-FR', {month: 'long'});
    const year = date.getFullYear();
    return `${dayOfWeek} ${day} ${month} ${year}`;
  }

  private renderTopBar(): JSX.Element {
    const currentDay = this.getCurrentDay();
    if (currentDay === undefined) {
      return <LoadingIndicator size="small" />;
    }
    return <span>{this.formatDay(currentDay.getTime())}</span>;
  }

  private renderReport(): JSX.Element {
    const {schedule, prodInfo, stocks} = this.state;
    const day = this.getCurrentDay();
    const operations = this.scheduleStore.getOperations();

    if (!schedule || !prodInfo || !day || !operations || !stocks) {
      return <LoadingIndicator size="large" />;
    }

    return (
      <ReportViewer
        schedule={schedule}
        operations={operations}
        day={day.getTime()}
        prodInfo={prodInfo}
        stocks={stocks}
      />
    );
  }

  public render(): JSX.Element {
    const day = this.getCurrentDay() || new Date();
    return (
      <AppWrapper>
        <TopBar>
          <NavigationIcon onClick={this.handlePreviousClick}>
            <SVGIcon name="caret-left" width={iconSize} height={iconSize} />
          </NavigationIcon>
          <TopBarTitle>{this.renderTopBar()}</TopBarTitle>
          <NavigationIcon onClick={this.handleNextClick}>
            <SVGIcon name="caret-right" width={iconSize} height={iconSize} />
          </NavigationIcon>
        </TopBar>
        <ButtonBar>
          <ReportButton onClick={() => bridge.printAsPDF()}>Imprimer</ReportButton>
          <ReportButton
            onClick={() => bridge.saveToPDF(`${this.getWindowTitle(day.getTime())}.pdf`)}
          >
            Télécharger
          </ReportButton>
        </ButtonBar>
        <ContentContainer>{this.renderReport()}</ContentContainer>
      </AppWrapper>
    );
  }
}

const iconSize = 16;

const AppWrapper = styled.div`
  display: flex;
  flex-direction: column;
  background-color: ${Palette.Clouds};
  @media print {
    background-color: ${Palette.White};
  }
`;

const TopBar = styled.div`
  flex-shrink: 0;
  height: 64px;
  display: flex;
  justify-content: space-between;
  background-color: ${Colors.PrimaryDark};
  color: ${Colors.TextOnPrimary};

  @media print {
    display: none;
  }
`;

const ButtonBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 16px;
  @media print {
    display: none;
  }
`;

const ReportButton = styled(Button)`
  margin-right: 16px;
  &:last-of-type {
    margin-right: 0;
  }
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

const ContentContainer = styled.div`
  flex-grow: 1;
  margin: 16px auto;
`;
