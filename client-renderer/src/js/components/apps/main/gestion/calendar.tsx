import * as React from 'react';
import styled from 'styled-components';

import {SVGIcon} from '@root/components/core/svg_icon';
import {getDayOfWeek, isWeekDay} from '@root/lib/utils';
import {theme} from '@root/theme';

const MONTH_IN_YEAR = 12;
const DAY_IN_WEEK = 7;
const DAY_IN_WORK_WEEK = 5;

interface CalendarProps {
  month: number;
  year: number;
  children(date: Date): JSX.Element;
  onPreviousClick(): void;
  onNextClick(): void;
  onDayContextMenu(event: React.MouseEvent, date: Date): void;
  onDayClick(event: React.MouseEvent, date: Date): void;
}

export class Calendar extends React.Component<CalendarProps, {}> {
  public static displayName = 'Calendar';

  private getDates(): Date[] {
    const {month, year} = this.props;
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);

    const firstDate = new Date(year, month, -getDayOfWeek(startOfMonth) + 1, MONTH_IN_YEAR);
    const endDate = new Date(
      year,
      month,
      endOfMonth.getDate() + DAY_IN_WEEK - 1 - getDayOfWeek(endOfMonth),
      MONTH_IN_YEAR
    );

    const dates: Date[] = [];
    let currentDate = firstDate;
    while (currentDate.getTime() <= endDate.getTime()) {
      if (isWeekDay(currentDate)) {
        dates.push(currentDate);
      }
      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  }

  private getWeeks(): Date[][] {
    let dates = this.getDates();
    const weeks: Date[][] = [];
    while (dates.length > 0) {
      const week = dates.slice(0, DAY_IN_WORK_WEEK);
      if (
        week[0].getMonth() === this.props.month ||
        week[week.length - 1].getMonth() === this.props.month
      ) {
        weeks.push(week);
      }
      dates = dates.slice(DAY_IN_WORK_WEEK, dates.length);
    }
    return weeks;
  }

  private renderDayCircle(date: Date): JSX.Element {
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();
    if (isToday) {
      return <TodayCircle>{date.getDate()}</TodayCircle>;
    }
    return <DayCircle>{date.getDate()}</DayCircle>;
  }

  private isOtherMonth(date: Date): boolean {
    const {month, year} = this.props;
    return date.getMonth() !== month || date.getFullYear() !== year;
  }

  public render(): JSX.Element {
    const {
      children,
      year,
      month,
      onPreviousClick,
      onNextClick,
      onDayContextMenu,
      onDayClick,
    } = this.props;
    const weeks = this.getWeeks();
    const firstWeek = weeks[0] || [];
    return (
      <CalendarTable>
        <CalendarHeader>
          <tr>
            <td colSpan={firstWeek.length}>
              <MonthYear>
                <div onClick={onPreviousClick}>
                  <SVGIcon name="caret-left" width={12} height={12} />
                </div>
                <CalendarHeaderValue>
                  {new Date(year, month).toLocaleString('fr-FR', {month: 'long', year: 'numeric'})}
                </CalendarHeaderValue>
                <div onClick={onNextClick}>
                  <SVGIcon name="caret-right" width={12} height={12} />
                </div>
              </MonthYear>
            </td>
          </tr>
          <tr>
            {firstWeek.map(date => (
              <td key={date.getTime()}>
                <CalendarHeaderValue>
                  {date.toLocaleString('fr-FR', {weekday: 'long'})}
                </CalendarHeaderValue>
              </td>
            ))}
          </tr>
        </CalendarHeader>
        <tbody>
          {weeks.map(week => (
            <tr key={`week-${week[0].getTime()}`}>
              {week.map(date => (
                <CalendarCell
                  key={date.getTime()}
                  style={{opacity: this.isOtherMonth(date) ? 0.8 : 1}}
                  onContextMenu={event => onDayContextMenu(event, date)}
                  onClick={event => onDayClick(event, date)}
                >
                  <CalendarCellHeader>{this.renderDayCircle(date)}</CalendarCellHeader>
                  {children(date)}
                </CalendarCell>
              ))}
            </tr>
          ))}
        </tbody>
      </CalendarTable>
    );
  }
}

const CalendarTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
`;

const CalendarHeader = styled.thead`
  background-color: ${theme.calendar.headerBackgroundColor};
  color: ${theme.calendar.headerTextColor};
  user-select: none;
  border: solid 2px ${theme.calendar.dayBorderColor};
`;

const MonthYear = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 23px;
  svg {
    fill: ${theme.calendar.headerTextColor};
    padding: 8px;
    cursor: pointer;
  }
`;

const CalendarHeaderValue = styled.div`
  text-transform: capitalize;
  text-align: center;
  padding: 4px 0;
`;

const CalendarCell = styled.td`
  width: 20%;
  height: 200px;
  padding: 0;
  vertical-align: top;
  background-color: ${theme.calendar.dayBackgroundColor};
  border: solid 2px ${theme.calendar.dayBorderColor};
`;

const CalendarCellHeader = styled.div`
  height: 48px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const DayCircle = styled.div`
  width: ${theme.calendar.dayCircleSize}px;
  height: ${theme.calendar.dayCircleSize}px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: ${theme.calendar.dayCircleSize / 2}px;
  background-color: ${theme.calendar.dayCircleBackgroundColor};
  color: ${theme.calendar.dayCircleTextColor};
  font-size: ${theme.calendar.dayCircleFontSize}px;
  font-weight: ${theme.calendar.dayCircleFontWeight};
  line-height: ${theme.calendar.dayCircleFontSize}px;
`;

const TodayCircle = styled(DayCircle)`
  background-color: ${theme.calendar.todayCircleBackgroundColor};
`;
