import {sum} from 'lodash-es';
import * as React from 'react';

import {BarChart} from '@root/components/apps/statistics/bar_chart';
import {BarFilter} from '@root/components/apps/statistics/bar_filter';
import {getWeekDays} from '@root/components/apps/statistics/time_format';
import {Colors, Palette} from '@root/theme';

import {BarType, StatsData, ProdRange, PlanDayStats} from '@shared/models';

interface StatsChartFormProps {
  prodHours: Map<string, ProdRange>;
  statsData: StatsData;
  date: number;
}

interface StatsChartFormState {
  selectedBarTypeNames: string[];
}

const barTypes: BarType[] = [
  {
    name: 'morning',
    label: 'Équipe matin',
    color: Palette.Concrete,
  },
  {
    name: 'afternoon',
    label: 'Équipe soir',
    color: Palette.Asbestos,
  },
  {
    name: 'all',
    label: 'Équipes cumulées',
    color: Colors.SecondaryDark,
  },
];

export class StatsChartForm extends React.Component<StatsChartFormProps, StatsChartFormState> {
  public static displayName = 'StatsChartForm';

  public constructor(props: StatsChartFormProps) {
    super(props);
    this.state = {
      selectedBarTypeNames: ['all'],
    };
  }

  private getSelectedBarTypes(selectedBarTypeNames: string[]): BarType[] {
    return barTypes.filter(({name}) => selectedBarTypeNames.indexOf(name) !== -1);
  }

  public render(): JSX.Element {
    const {statsData, date, prodHours} = this.props;
    const {selectedBarTypeNames} = this.state;
    return (
      <div>
        <BarFilter
          barTypes={barTypes}
          checked={selectedBarTypeNames}
          onChange={selectedBarTypeNames => this.setState({selectedBarTypeNames})}
        />
        <BarChart
          statsData={statsData}
          date={date}
          chartConfig={{
            mode: 'sum',
            renderX: (days: number[]): string =>
              new Date(days[0]).toLocaleString('fr', {weekday: 'long'}),
            renderY: (value: number): string => `${value} m`,
            xAxis: (statsData: StatsData, date: number): number[][] =>
              getWeekDays(prodHours, date).map(d => [d]),
            yAxis: (dayStats: PlanDayStats) =>
              this.getSelectedBarTypes(selectedBarTypeNames).map(barType => {
                const {color, name} = barType;
                let value = 0;
                if (name === 'morning' || name === 'all') {
                  value += sum(dayStats.morningProds.map(p => p.metrage));
                }
                if (name === 'afternoon' || name === 'all') {
                  value += sum(dayStats.afternoonProds.map(p => p.metrage));
                }
                return {value, color};
              }),
          }}
        />
      </div>
    );
  }
}
