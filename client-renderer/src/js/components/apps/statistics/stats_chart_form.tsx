import {sum} from 'lodash-es';
import * as React from 'react';

import {BarChart} from '@root/components/apps/statistics/bar_chart';
import {BarFilter} from '@root/components/apps/statistics/bar_filter';
import {StatsPeriod} from '@root/lib/statistics/period';
import {numberWithSeparator} from '@root/lib/utils';
import {Colors, Palette} from '@root/theme';

import {BarType, StatsData, ProdRange, PlanDayStats} from '@shared/models';

interface StatsChartFormProps {
  prodHours: Map<string, ProdRange>;
  statsData: StatsData;
  statsPeriod: StatsPeriod;
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
    const {statsData, date, prodHours, statsPeriod} = this.props;
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
          prodHours={prodHours}
          date={date}
          chartConfig={{
            mode: 'sum',
            renderX: statsPeriod.renderX,
            renderY: (value: number): string => `${numberWithSeparator(value)} m`,
            xAxis: statsPeriod.xAxis,
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
