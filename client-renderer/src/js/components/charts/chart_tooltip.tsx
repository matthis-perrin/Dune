import * as Plottable from 'plottable';
import React from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';

import {theme} from '@root/theme';

export const CHART_TOOLTIP_ID = 'chart_tooltip_id';

export function createChartTooltip<T>(
  plot: Plottable.Plots.Bar<unknown, unknown>,

  tooltipWidth: number,

  tooltipContent: (datum: T) => JSX.Element | string
): void {
  // Create the tooltip container

  const tooltipComponentRef = React.createRef<ChartTooltip>();

  const tooltipContainer = document.createElement('div');

  tooltipContainer.style.position = 'absolute';

  tooltipContainer.style.width = `${tooltipWidth}px`;

  tooltipContainer.style.top = '-10000px';

  tooltipContainer.style.left = '-10000px';

  tooltipContainer.style.pointerEvents = 'none';

  tooltipContainer.style.transform = 'translateY(-105%)';

  tooltipContainer.style.transition = 'top 100ms ease 0s, left 100ms ease 0s';

  tooltipContainer.id = CHART_TOOLTIP_ID;

  document.body.appendChild(tooltipContainer);

  ReactDOM.render(<ChartTooltip ref={tooltipComponentRef} />, tooltipContainer);

  // Create a Pointer gesture that controls showing and hiding the tooltips

  const pointer = new Plottable.Interactions.Pointer();

  let previouslyHoveredEntity: Plottable.Plots.IPlotEntity | undefined;

  const resetStyles = () =>
    previouslyHoveredEntity && previouslyHoveredEntity.selection.attr('opacity', 1);

  pointer.onPointerMove(p => {
    const tooltipComponent = tooltipComponentRef.current;

    const closest = plot.entityNearest(p);

    const barElement = plot.content().node();

    const barElementRect = (barElement as HTMLElement).getBoundingClientRect();

    const {left, top} = barElementRect;

    const bodyWidth = document.body.getBoundingClientRect().width;

    const x = Math.min(
      bodyWidth - tooltipWidth,

      Math.max(0, closest.position.x + left - tooltipWidth / 2)
    );

    resetStyles();

    if (closest && tooltipComponent) {
      tooltipContainer.style.top = `${closest.position.y + top}px`;

      tooltipContainer.style.left = `${x}px`;

      tooltipComponent.setContent(tooltipContent(closest.datum as T));

      closest.selection.attr('opacity', theme.cadencier.tooltipOpacity);

      previouslyHoveredEntity = closest;
    }
  });

  pointer.onPointerExit(() => {
    const tooltipComponent = tooltipComponentRef.current;

    if (tooltipComponent) {
      tooltipComponent.setContent(undefined);

      tooltipContainer.style.top = '-10000px';

      tooltipContainer.style.left = '-10000px';
    }

    resetStyles();
  });

  // Attach the gesture to the chart

  pointer.attachTo(plot);
}

interface ChartTooltipProps {}

interface ChartTooltipState {
  content?: JSX.Element | string;
}

class ChartTooltip extends React.Component<ChartTooltipProps, ChartTooltipState> {
  public static displayName = 'ChartTooltip';

  public constructor(props: ChartTooltipProps) {
    super(props);

    this.state = {};
  }

  public setContent(content?: JSX.Element | string): void {
    this.setState({content});
  }

  public render(): JSX.Element {
    const {content} = this.state;

    return <ChartTooltipWrapper>{content}</ChartTooltipWrapper>;
  }
}

const ChartTooltipWrapper = styled.div`
  background-color: ${theme.cadencier.tooltipBackgroundColor};

  padding: 8px 12px;

  border-radius: 3px;

  color: ${theme.cadencier.textColor};
`;
