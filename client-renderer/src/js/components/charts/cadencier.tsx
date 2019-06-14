import {min, max} from 'lodash-es';
import * as Plottable from 'plottable';
import * as React from 'react';
import styled from 'styled-components';

import {PlottableCSS} from '@root/components/charts/plottable_css';
import {LoadingIndicator} from '@root/components/core/loading_indicator';
import {bridge} from '@root/lib/bridge';

import {CadencierType, aggregateByMonth, createMonthsRange} from '@shared/lib/cadencier';
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
  private plot: Plottable.Plots.Bar<number, number> | undefined = undefined;

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
    const chartElement = this.chartRef.current;
    const loadingElement = this.loadingRef.current;
    if (!chartElement || !loadingElement) {
      return;
    }

    const data = this.getVenteData(cadencier);

    const xScale = new Plottable.Scales.Linear();
    const yScale = new Plottable.Scales.Linear();

    loadingElement.style.display = 'none';
    chartElement.style.display = 'block';
    this.plot = new Plottable.Plots.Bar<number, number>()
      .addDataset(new Plottable.Dataset(data))
      .x(d => d.time, xScale)
      .y(d => d.value, yScale)
      .animated(true)
      .renderTo((chartElement as unknown) as HTMLElement);
  };

  private getVenteData(cadencier: VenteLight[]): {time: number; value: number}[] {
    const facturesByMonth = aggregateByMonth(cadencier, CadencierType.FACTURE_COMPTABILISEE);
    const allTs = Array.from(facturesByMonth.keys());
    const firstTs = min(allTs);
    const lastTs = max(allTs);
    if (!firstTs || !lastTs) {
      return [];
    }
    const data = createMonthsRange(firstTs, lastTs, true).map((ts, index) => ({
      time: index,
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
`;

const LoadingContainer = styled.div`
  width: 100%;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
`;
