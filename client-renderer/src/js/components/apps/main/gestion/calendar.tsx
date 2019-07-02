import * as React from 'react';
import styled from 'styled-components';

import {getDayOfWeek, isWeekDay} from '@root/lib/utils';
import {theme} from '@root/theme';

interface Props {
  month: number;
  year: number;
  children(date: Date): JSX.Element;
}

export class Calendar extends React.Component<Props, {}> {
  public static displayName = 'Calendar';

  private getDates(): Date[] {
    const {month, year} = this.props;
    const begginingOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);

    const firstDate = new Date(year, month, -getDayOfWeek(begginingOfMonth) + 1, 12);
    const endDate = new Date(year, month, endOfMonth.getDate() + 6 - getDayOfWeek(endOfMonth), 12);

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
      const week = dates.slice(0, 5);
      weeks.push(week);
      dates = dates.slice(5, dates.length);
    }
    return weeks;
  }

  public render(): JSX.Element {
    const {children} = this.props;
    return (
      <CalendarTable>
        <tbody>
          {this.getWeeks().map(week => (
            <tr>
              {week.map(date => (
                <CalendarCell>
                  <CalendarCellHeader>
                    <DayCircle>{date.getDate()}</DayCircle>
                  </CalendarCellHeader>
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

const CalendarCell = styled.td`
  width: 20%;
  height: 200px;
  padding: 0;
  vertical-align: top;
  background-color: ${theme.calendar.dayBackgroundColor};
  border: solid 2px ${theme.calendar.dayBorderColor};
`;

const CalendarCellHeader = styled.div`
  height: 40px;
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
