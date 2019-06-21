import {min, max} from 'lodash-es';
import * as Plottable from 'plottable';
import * as React from 'react';
import styled from 'styled-components';

import {createChartTooltip} from '@root/components/charts/chart_tooltip';
import {PlottableCSS} from '@root/components/charts/plottable_css';
import {LoadingIndicator} from '@root/components/core/loading_indicator';
import {bridge} from '@root/lib/bridge';
import {couleurByName, theme} from '@root/theme';

import {CadencierType, aggregateByMonth, createMonthsRange} from '@shared/lib/cadencier';
import {MONTHS_STRING} from '@shared/lib/time';
import {BobineFille, Vente} from '@shared/models';

interface VenteDatum {
  time: Date;
  value: Vente[];
}

enum DisplayMode {
  LOADING,
  LOADED,
  EMPTY,
}

interface BobineCadencierChartProps {
  bobine?: BobineFille;
}

interface BobineCadencierChartState {}

export class BobineCadencierChart extends React.Component<
  BobineCadencierChartProps,
  BobineCadencierChartState
> {
  public static displayName = 'BobineCadencierChart';
  private readonly chartRef = React.createRef<HTMLDivElement>();
  private readonly loadingRef = React.createRef<HTMLDivElement>();
  private readonly emptyRef = React.createRef<HTMLDivElement>();
  private plot: Plottable.Components.Table | undefined = undefined;

  public constructor(props: BobineCadencierChartProps) {
    super(props);
    this.state = {};
  }

  public componentDidMount(): void {
    window.addEventListener('resize', this.handleRise);
    const {bobine} = this.props;
    if (!bobine) {
      return;
    }
    this.loadBobine(bobine);
  }

  public componentDidUpdate(prevProps: BobineCadencierChartProps): void {
    if (this.props.bobine === undefined) {
      if (prevProps.bobine === undefined) {
        return;
      } else {
        this.setDisplayMode(DisplayMode.LOADING);
      }
    } else {
      if (prevProps.bobine === undefined) {
        this.loadBobine(this.props.bobine);
      } else {
        if (prevProps.bobine.ref !== this.props.bobine.ref) {
          this.loadBobine(this.props.bobine);
        }
      }
    }
  }

  private setDisplayMode(mode: DisplayMode): void {
    const chartElement = this.chartRef.current;
    const loadingElement = this.loadingRef.current;
    const emptyElement = this.emptyRef.current;
    if (!chartElement || !loadingElement || !emptyElement) {
      return;
    }
    loadingElement.style.display = mode === DisplayMode.LOADING ? 'block' : 'none';
    chartElement.style.display = mode === DisplayMode.LOADED ? 'block' : 'none';
    emptyElement.style.display = mode === DisplayMode.EMPTY ? 'block' : 'none';
  }

  private loadBobine(bobine: BobineFille): void {
    this.setDisplayMode(DisplayMode.LOADING);

    const {ref} = bobine;
    bridge
      .listCadencierForBobine(ref)
      .then(cadencier => this.createPlot(bobine, cadencier))
      .catch(console.error);
  }

  private readonly handleRise = (): void => {
    if (!this.plot) {
      return;
    }
    this.plot.redraw();
  };

  private readonly createPlot = (bobine: BobineFille, cadencier: Vente[]): void => {
    // Check this is a good time to render
    const chartElement = this.chartRef.current;
    if (!chartElement) {
      return;
    }

    // Data computation
    const data = this.getVenteData(cadencier);
    if (data.length === 0) {
      this.setDisplayMode(DisplayMode.EMPTY);
      return;
    }
    const first = data[0];
    const last = data[data.length - 1];

    // Scales
    const xScale = new Plottable.Scales.Time().domain([first.time, last.time]);
    const yScale = new Plottable.Scales.Linear();

    // Bars
    const getValue = (datum: VenteDatum) => {
      return datum.value.reduce(
        (acc, curr) =>
          acc + (curr.type === CadencierType.FACTURE_COMPTABILISEE ? curr.quantity : 0),
        0
      );
    };
    const color = bobine.couleurPapier;
    const barColor =
      color === undefined || ['BLANC', 'IVOIRE'].indexOf(color) !== -1
        ? theme.cadencier.whiteBobineBarColor
        : couleurByName(color);
    const bars = new Plottable.Plots.Bar<Date, number>()
      .addDataset(new Plottable.Dataset(data))
      .x((d: VenteDatum) => d.time, xScale)
      .y(getValue, yScale)
      .animated(true)
      .attr('fill', barColor);

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
    this.plot = new Plottable.Components.Table([[yAxis, bars], [undefined, xAxis]]);

    // Tooltips
    createChartTooltip<VenteDatum>(bars, 300, datum => {
      const monthStr = MONTHS_STRING[datum.time.getMonth()];
      const dateStr = `${monthStr} ${datum.time.getFullYear()}`;
      const factures = datum.value.filter(d => d.type === CadencierType.FACTURE_COMPTABILISEE);
      const facturesSum = factures.reduce((acc, curr) => acc + curr.quantity, 0);
      return (
        <div>
          {dateStr}
          <br />
          {`${factures.length} factures comptabilisées`}
          <br />
          {`Total : ${facturesSum}`}
        </div>
      );
    });

    // Gesture
    const pziXAxis = new Plottable.Interactions.PanZoom();
    pziXAxis
      .addXScale(xScale)
      .minDomainValue(xScale, first.time.getTime())
      .maxDomainValue(xScale, last.time.getTime());
    pziXAxis.attachTo(xAxis);
    pziXAxis.attachTo(bars);

    // Rendering
    this.setDisplayMode(DisplayMode.LOADED);
    this.plot.renderTo(chartElement);
  };

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

  public render(): JSX.Element {
    return (
      <React.Fragment>
        <PlottableCSS />
        <ChartContainer style={{display: 'none'}} ref={this.chartRef} />
        <EmptyChartContainer style={{display: 'none'}} ref={this.emptyRef}>
          Aucune vente enregistrée
        </EmptyChartContainer>
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

const EmptyChartContainer = styled.div``;
