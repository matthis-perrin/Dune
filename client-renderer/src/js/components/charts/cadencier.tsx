import {min, max} from 'lodash-es';
import * as Plottable from 'plottable';
import * as React from 'react';
import styled from 'styled-components';

import {PlottableCSS} from '@root/components/charts/plottable_css';
import {LoadingIndicator} from '@root/components/core/loading_indicator';
import {bridge} from '@root/lib/bridge';

import {
  CadencierType,
  aggregateByMonth,
  createMonthsRange,
  roundToMonth,
} from '@shared/lib/cadencier';
import {VenteLight} from '@shared/models';

interface BobineCadencierChartProps {
  bobineRef: string;
}

interface BobineCadencierChartState {}

export class BobineCadencierChart extends React.Component<
  BobineCadencierChartProps,
  BobineCadencierChartState
> {
  public static displayName = 'BobineCadencierChart';
  private readonly chartRef = React.createRef<HTMLDivElement>();
  private readonly loadingRef = React.createRef<HTMLDivElement>();
  private plot: Plottable.Components.Table | undefined = undefined;

  public constructor(props: BobineCadencierChartProps) {
    super(props);
    this.state = {};
  }

  public componentDidMount(): void {
    const {bobineRef} = this.props;
    bridge
      .listCadencier(bobineRef)
      .then(this.createPlot)
      .catch(console.error);
    window.addEventListener('resize', this.handleRise);
  }

  private readonly handleRise = (): void => {
    if (!this.plot) {
      return;
    }
    this.plot.redraw();
  };

  private readonly createPlot = (cadencier: VenteLight[]): void => {
    // Check this is a good time to render
    const chartElement = this.chartRef.current;
    const loadingElement = this.loadingRef.current;
    if (!chartElement || !loadingElement) {
      return;
    }

    // Data computation
    const data = this.getVenteData(cadencier);
    const first = data[0];
    const last = data[data.length - 1];

    // Scales
    const xScale = new Plottable.Scales.Time().domain([first.time, last.time]);
    const yScale = new Plottable.Scales.Linear();

    // Bars
    const bars = new Plottable.Plots.Bar<Date, number>()
      .addDataset(new Plottable.Dataset(data))
      .x(d => d.time, xScale)
      .y(d => d.value, yScale)
      .animated(true);

    // Axis
    const xAxis = new Plottable.Axes.Time(xScale, 'bottom');
    const axisConfiguration = [
      [
        {interval: 'month', step: 1, formatter: Plottable.Formatters.time('%b')},
        {interval: 'year', step: 1, formatter: Plottable.Formatters.time('%Y')},
      ],
      [{interval: 'year', step: 1, formatter: Plottable.Formatters.time('%Y')}],
    ];
    xAxis.axisConfigurations(axisConfiguration);
    const yAxis = new Plottable.Axes.Numeric(yScale, 'left');

    // Final Plot
    this.plot = new Plottable.Components.Table([[yAxis, bars], [null, xAxis]]);

    // Gesture
    const pziXAxis = new Plottable.Interactions.PanZoom();
    pziXAxis
      .addXScale(xScale)
      .minDomainValue(xScale, first.time.getTime())
      .maxDomainValue(xScale, last.time.getTime());
    pziXAxis.attachTo(xAxis);
    pziXAxis.attachTo(bars);

    // Rendering
    loadingElement.style.display = 'none';
    chartElement.style.display = 'block';
    this.plot.renderTo(chartElement);
  };

  private getVenteData(cadencier: VenteLight[]): {time: Date; value: number}[] {
    const facturesByMonth = aggregateByMonth(cadencier, CadencierType.FACTURE_COMPTABILISEE);
    const allTs = Array.from(facturesByMonth.keys());
    const firstTs = min(allTs) || Date.now();
    const lastTs = max(allTs) || Date.now();

    const data = createMonthsRange(firstTs, lastTs, true).map(ts => ({
      time: new Date(ts),
      value: facturesByMonth.get(ts) || 0,
    }));
    return data;
  }

  public render(): JSX.Element {
    return (
      <React.Fragment>
        <PlottableCSS />
        <ChartContainer style={{display: 'none'}} ref={this.chartRef} />
        <LoadingContainer ref={this.loadingRef}>
          <LoadingIndicator size="medium" />
        </LoadingContainer>
      </React.Fragment>
    );
  }
}

const ChartContainer = styled.div`
  width: 100%;
  height: 100%;
  box-sizing: border-box;
`;

const LoadingContainer = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;
