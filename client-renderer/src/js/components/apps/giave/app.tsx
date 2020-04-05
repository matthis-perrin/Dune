import React from 'react';
import styled from 'styled-components';

import {LoadingIndicator} from '@root/components/core/loading_indicator';
import {SVGIcon} from '@root/components/core/svg_icon';
import {Colors, Palette} from '@root/theme';

import {getWeekDay, isWeekDay} from '@shared/lib/time';
import {startOfDay, capitalize} from '@shared/lib/utils';
interface GiaveAppProps {
  initialDay?: number;
}

interface GiaveAppState {
  day?: Date;
}

export class GiaveApp extends React.Component<GiaveAppProps, GiaveAppState> {
  public static displayName = 'GiaveApp';

  public constructor(props: GiaveAppProps) {
    super(props);
    if (props.initialDay) {
      const date = new Date(props.initialDay);
      this.state = {day: date};
    } else {
      this.state = {};
    }
  }

  private readonly handlePreviousClick = (): void => {
    const currentDay = this.getCurrentDay();
    if (currentDay) {
      const newDay = currentDay;
      newDay.setDate(currentDay.getDate() - 1);
      while (!isWeekDay(newDay)) {
        newDay.setDate(currentDay.getDate() - 1);
      }
      this.setState({day: newDay});
    }
  };

  private readonly handleNextClick = (): void => {
    const currentDay = this.getCurrentDay();
    if (currentDay) {
      const newDay = currentDay;
      newDay.setDate(currentDay.getDate() + 1);
      while (!isWeekDay(newDay)) {
        newDay.setDate(currentDay.getDate() + 1);
      }
      this.setState({day: newDay});
    }
  };

  private getCurrentDay(): Date | undefined {
    const {day} = this.state;
    const {initialDay} = this.props;
    if (day) {
      return day;
    }
    return initialDay !== undefined ? startOfDay(new Date(initialDay)) : undefined;
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

  public render(): JSX.Element {
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
      </AppWrapper>
    );
  }
}

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
