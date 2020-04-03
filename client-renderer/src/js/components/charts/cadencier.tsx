import * as Plottable from 'plottable';
import React from 'react';
import styled from 'styled-components';

import {createChartTooltip, CHART_TOOLTIP_ID} from '@root/components/charts/chart_tooltip';
import {PlottableCSS} from '@root/components/charts/plottable_css';
import {LoadingIndicator} from '@root/components/core/loading_indicator';
import {bridge} from '@root/lib/bridge';
import {colorsStore} from '@root/stores/data_store';
import {theme} from '@root/theme';

import {CadencierType} from '@shared/lib/cadencier';
import {BobineFille, Vente} from '@shared/models';

export interface VenteDatum {
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
  axisConfiguration: Plottable.Axes.TimeAxisTierConfiguration[][];
  tooltipRenderer(datum: VenteDatum): string | JSX.Element;
  getVenteData(cadencier: Vente[]): VenteDatum[];
}

export class BobineCadencierChart extends React.Component<BobineCadencierChartProps> {
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
    colorsStore.addListener(this.handleColorsChanged);
    window.addEventListener('resize', this.handleResize);
    const {bobine} = this.props;
    if (!bobine) {
      return;
    }
  }

  public componentWillUnmount(): void {
    colorsStore.removeListener(this.handleColorsChanged);
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

  private readonly handleColorsChanged = (): void => {
    if (this.props.bobine) {
      this.loadBobine(this.props.bobine);
    }
  };

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

  private readonly handleResize = (): void => {
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
    const data = this.props.getVenteData(cadencier);
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
    const color = colorsStore.get(bobine.couleurPapier);
    const barColor =
      ['BLANC', 'IVOIRE'].indexOf(color.name) !== -1
        ? theme.cadencier.whiteBobineBarColor
        : color.backgroundHex;

    const bars = new Plottable.Plots.Bar<Date, number>()
      .addDataset(new Plottable.Dataset(data))
      .x((d: VenteDatum) => d.time, xScale)
      .y(getValue, yScale)
      .animated(true)
      .attr('fill', barColor);

    // Axis
    const xAxis = new Plottable.Axes.Time(xScale, 'bottom');
    xAxis.axisConfigurations(this.props.axisConfiguration);
    const yAxis = new Plottable.Axes.Numeric(yScale, 'left');

    // Final Plot
    this.plot = new Plottable.Components.Table([
      [yAxis, bars],
      [undefined, xAxis],
    ]);

    // Tooltips
    const tooltip = document.getElementById(CHART_TOOLTIP_ID);
    if (tooltip) {
      tooltip.remove();
    }
    createChartTooltip<VenteDatum>(bars, theme.cadencier.tooltipWidth, this.props.tooltipRenderer);

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
    chartElement.innerHTML = '';
    this.plot.renderTo(chartElement);
  };

  public redrawChart(): void {
    if (this.plot) {
      this.plot.redraw();
    }
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
