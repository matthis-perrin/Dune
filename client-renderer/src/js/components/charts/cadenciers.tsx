import {min, max} from 'lodash-es';
import * as Plottable from 'plottable';
import * as React from 'react';

import {BobineCadencierChart, VenteDatum} from '@root/components/charts/cadencier';
import {numberWithSeparator} from '@root/lib/utils';

import {
  CadencierType,
  aggregateByMonth,
  createMonthsRange,
  aggregateByDay,
  createDaysRange,
  aggregateByYear,
  createYearsRange,
} from '@shared/lib/cadencier';
import {MONTHS_STRING} from '@shared/lib/time';
import {BobineFille, Vente} from '@shared/models';

interface BobineCadencierChartProps {
  bobine?: BobineFille;
  chartRef?: React.Ref<BobineCadencierChart>;
}

export class BobineCadencierChartByDay extends React.Component<BobineCadencierChartProps> {
  public static displayName = 'BobineCadencierChartByDay';

  private getVenteData(cadencier: Vente[]): VenteDatum[] {
    const facturesByDay = aggregateByDay(cadencier);
    const allTs = Array.from(facturesByDay.keys());
    if (allTs.length === 0) {
      return [];
    }
    const firstTs = min(allTs) || Date.now();
    const lastTs = max(allTs) || Date.now();

    const data = createDaysRange(firstTs, lastTs).map(ts => ({
      time: new Date(ts),
      value: facturesByDay.get(ts) || [],
    }));
    return data;
  }

  private tooltipRenderer(datum: VenteDatum): string | JSX.Element {
    const dateStr = new Date(datum.time).toLocaleDateString('fr');
    const factures = datum.value.filter(d => d.type === CadencierType.FACTURE_COMPTABILISEE);
    const facturesSum = factures.reduce((acc, curr) => acc + curr.quantity, 0);
    return (
      <div>
        {dateStr}
        <br />
        {`${numberWithSeparator(factures.length)} factures comptabilisées`}
        <br />
        {`Total : ${numberWithSeparator(facturesSum)}`}
      </div>
    );
  }

  public render(): JSX.Element {
    const {bobine, chartRef} = this.props;
    return (
      <BobineCadencierChart
        ref={chartRef}
        bobine={bobine}
        axisConfiguration={[
          [
            {interval: 'day', step: 1, formatter: Plottable.Formatters.time('%d')},
            {interval: 'month', step: 1, formatter: Plottable.Formatters.time('%b')},
            {interval: 'year', step: 1, formatter: Plottable.Formatters.time('%Y')},
          ],
          [
            {interval: 'month', step: 1, formatter: Plottable.Formatters.time('%b')},
            {interval: 'year', step: 1, formatter: Plottable.Formatters.time('%Y')},
          ],
          [{interval: 'year', step: 1, formatter: Plottable.Formatters.time('%Y')}],
        ]}
        tooltipRenderer={this.tooltipRenderer}
        getVenteData={this.getVenteData}
      />
    );
  }
}

export class BobineCadencierChartByMonth extends React.Component<BobineCadencierChartProps> {
  public static displayName = 'BobineCadencierChartByMonth';

  private getVenteData(cadencier: Vente[]): VenteDatum[] {
    const facturesByMonth = aggregateByMonth(cadencier);
    const allTs = Array.from(facturesByMonth.keys());
    if (allTs.length === 0) {
      return [];
    }
    const firstTs = min(allTs) || Date.now();
    const lastTs = max(allTs) || Date.now();

    const data = createMonthsRange(firstTs, lastTs, true).map(ts => ({
      time: new Date(ts),
      value: facturesByMonth.get(ts) || [],
    }));
    return data;
  }

  private tooltipRenderer(datum: VenteDatum): string | JSX.Element {
    const monthStr = MONTHS_STRING[datum.time.getMonth()];
    const dateStr = `${monthStr} ${datum.time.getFullYear()}`;
    const factures = datum.value.filter(d => d.type === CadencierType.FACTURE_COMPTABILISEE);
    const facturesSum = factures.reduce((acc, curr) => acc + curr.quantity, 0);
    return (
      <div>
        {dateStr}
        <br />
        {`${numberWithSeparator(factures.length)} factures comptabilisées`}
        <br />
        {`Total : ${numberWithSeparator(facturesSum)}`}
      </div>
    );
  }

  public render(): JSX.Element {
    const {bobine, chartRef} = this.props;
    return (
      <BobineCadencierChart
        ref={chartRef}
        bobine={bobine}
        axisConfiguration={[
          [
            {interval: 'month', step: 1, formatter: Plottable.Formatters.time('%b')},
            {interval: 'year', step: 1, formatter: Plottable.Formatters.time('%Y')},
          ],
          [{interval: 'year', step: 1, formatter: Plottable.Formatters.time('%Y')}],
        ]}
        tooltipRenderer={this.tooltipRenderer}
        getVenteData={this.getVenteData}
      />
    );
  }
}

export class BobineCadencierChartByYear extends React.Component<BobineCadencierChartProps> {
  public static displayName = 'BobineCadencierChartByYear';

  private getVenteData(cadencier: Vente[]): VenteDatum[] {
    const facturesByYear = aggregateByYear(cadencier);
    const allTs = Array.from(facturesByYear.keys());
    if (allTs.length === 0) {
      return [];
    }
    const firstTs = min(allTs) || Date.now();
    const lastTs = max(allTs) || Date.now();

    const data = createYearsRange(firstTs, lastTs).map(ts => ({
      time: new Date(ts),
      value: facturesByYear.get(ts) || [],
    }));
    return data;
  }

  private tooltipRenderer(datum: VenteDatum): string | JSX.Element {
    const dateStr = datum.time.getFullYear();
    const factures = datum.value.filter(d => d.type === CadencierType.FACTURE_COMPTABILISEE);
    const facturesSum = factures.reduce((acc, curr) => acc + curr.quantity, 0);
    return (
      <div>
        {dateStr}
        <br />
        {`${numberWithSeparator(factures.length)} factures comptabilisées`}
        <br />
        {`Total : ${numberWithSeparator(facturesSum)}`}
      </div>
    );
  }

  public render(): JSX.Element {
    const {bobine, chartRef} = this.props;
    return (
      <BobineCadencierChart
        ref={chartRef}
        bobine={bobine}
        axisConfiguration={[
          [{interval: 'year', step: 1, formatter: Plottable.Formatters.time('%Y')}],
        ]}
        tooltipRenderer={this.tooltipRenderer}
        getVenteData={this.getVenteData}
      />
    );
  }
}
