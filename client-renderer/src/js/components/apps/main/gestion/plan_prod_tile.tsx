import {omit, maxBy} from 'lodash-es';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import styled from 'styled-components';

import {PlanProdViewer} from '@root/components/apps/main/gestion/plan_prod_viewer';
import {HTMLDivProps} from '@root/components/core/common';
import {SCROLLBAR_WIDTH} from '@root/components/core/size_monitor';
import {WithColor} from '@root/components/core/with_colors';
import {Palette, theme} from '@root/theme';

import {getRefenteLabel} from '@shared/lib/refentes';
import {PlanProduction, Stock, BobineQuantities} from '@shared/models';

const SHOW_VIEWER_TIMEOUT_MS = 100;

interface Props extends HTMLDivProps {
  planProd: PlanProduction;
  stocks: Map<string, Stock[]>;
  cadencier: Map<string, Map<number, number>>;
  bobineQuantities: BobineQuantities[];
}

export class PlanProdTile extends React.Component<Props> {
  public static displayName = 'PlanProdTile';
  private readonly wrapperRef = React.createRef<HTMLDivElement>();
  private showViewerTimeout: number | undefined;

  public constructor(props: Props) {
    super(props);
  }

  private getViewerId(): string {
    return `calendar-viewer-${this.props.planProd.id}`;
  }

  private getViewerWidthHeightRatio(callback: (ratio: number) => void): void {
    const VIEWER_TEST_WIDTH = 2000;
    this.createViewer(VIEWER_TEST_WIDTH, height => {
      callback(VIEWER_TEST_WIDTH / height || 0);
    });
  }

  private getMaxViewerDimension(
    width: number,
    height: number,
    ratio: number
  ): {width: number; height: number} {
    const heightFromWidth = width / ratio;
    const widthFromHeight = height * ratio;
    if (heightFromWidth < height) {
      return {width, height: heightFromWidth};
    }
    return {width: widthFromHeight, height};
  }

  private createViewer(width: number, heightCallback?: (height: number) => void): HTMLDivElement {
    const {planProd, stocks, cadencier, bobineQuantities} = this.props;

    this.removeViewer();

    const viewerContainer = document.createElement('div');
    viewerContainer.style.position = 'absolute';
    viewerContainer.style.left = '-10000px';
    viewerContainer.style.top = '-10000px';
    viewerContainer.style.pointerEvents = 'none';
    viewerContainer.id = this.getViewerId();
    document.body.appendChild(viewerContainer);

    const viewerRef = React.createRef<PlanProdViewer>();

    ReactDOM.render(
      <PlanProdViewer
        ref={viewerRef}
        planProd={planProd}
        width={width}
        bobineQuantities={bobineQuantities}
        cadencier={cadencier}
        stocks={stocks}
        onHeightAvailable={heightCallback}
      />,
      viewerContainer
    );
    return viewerContainer;
  }

  private removeViewer(): void {
    if (this.showViewerTimeout) {
      clearTimeout(this.showViewerTimeout);
    }
    const element = document.getElementById(this.getViewerId());
    if (element) {
      element.remove();
    }
  }

  private showViewer(): void {
    if (this.showViewerTimeout) {
      clearTimeout(this.showViewerTimeout);
    }
    this.getViewerWidthHeightRatio(ratio => {
      const element = this.wrapperRef.current;
      if (!element) {
        return;
      }
      const viewerMargin = theme.viewer.margin;
      const viewerPadding = theme.viewer.padding;
      const distanceFromTile = theme.viewer.distanceFromElement;
      const emptySpace = viewerMargin + 2 * viewerPadding + distanceFromTile;
      const availableWidth = window.innerWidth - SCROLLBAR_WIDTH - emptySpace;
      const availableHeight = window.innerHeight - emptySpace;
      const {left, top, width, height} = element.getBoundingClientRect();

      const spaces = [
        {position: 'left', width: left - emptySpace, height: availableHeight},
        {position: 'right', width: availableWidth - left - width, height: availableHeight},
        {position: 'top', width: availableWidth, height: top - emptySpace},
        {position: 'bottom', width: availableWidth, height: availableHeight - top - height},
      ];

      const best = maxBy(
        spaces.map(space => ({
          position: space.position,
          ...this.getMaxViewerDimension(space.width, space.height, ratio),
        })),
        space => space.width
      );
      if (!best) {
        return;
      }

      let viewerLeft = 0;
      let viewerTop = 0;

      if (best.position === 'left') {
        viewerLeft = left - best.width - distanceFromTile - 2 * viewerPadding;
        viewerTop = top + height / 2 - best.height / 2;
      } else if (best.position === 'right') {
        viewerLeft = left + width + distanceFromTile + 2 * viewerPadding;
        viewerTop = top + height / 2 - best.height / 2;
      } else if (best.position === 'top') {
        viewerLeft = left + width / 2 - best.width / 2;
        viewerTop = top - distanceFromTile - 2 * viewerPadding - best.height;
      } else if (best.position === 'bottom') {
        viewerLeft = left + width / 2 - best.width / 2;
        viewerTop = top + height + distanceFromTile + 2 * viewerPadding;
      }

      viewerLeft = Math.max(
        viewerMargin / 2,
        Math.min(availableWidth - best.width + distanceFromTile, viewerLeft)
      );
      viewerTop = Math.max(
        viewerMargin / 2,
        Math.min(availableHeight - best.height + distanceFromTile, viewerTop)
      );

      const viewerContainer = this.createViewer(best.width);
      viewerContainer.style.left = `${viewerLeft}px`;
      viewerContainer.style.top = `${viewerTop}px`;
      viewerContainer.style.width = `${best.width}px`;
      viewerContainer.style.height = `${best.height}px`;
      viewerContainer.style.backgroundColor = Palette.White;
      viewerContainer.style.padding = `${viewerPadding}px`;
      viewerContainer.style.boxShadow = theme.viewer.shadow;
      viewerContainer.style.transition = 'opacity 100ms ease-in';
      viewerContainer.style.opacity = '0';
      this.showViewerTimeout = setTimeout(() => {
        viewerContainer.style.opacity = '1';
      }, SHOW_VIEWER_TIMEOUT_MS);
    });
  }

  public render(): JSX.Element {
    const {planProd} = this.props;
    const rest = omit(this.props, ['data', 'ref']);
    return (
      <WithColor color={planProd.data.papier.couleurPapier}>
        {color => (
          <TileWrapper
            // tslint:disable-next-line:no-any no-unsafe-any
            ref={this.wrapperRef as any}
            onMouseEnter={() => this.showViewer()}
            onMouseLeave={() => this.removeViewer()}
            {...rest}
            style={{
              backgroundColor: color.backgroundHex,
              color: color.textHex,
              border: `solid 1px ${color.hasBorder ? color.textHex : 'transparent'}`,
            }}
          >
            {getRefenteLabel(planProd.data.refente)}
          </TileWrapper>
        )}
      </WithColor>
    );
  }
}

const TileWrapper = styled.div`
  padding: 4px 8px;
  margin: 0 4px 4px 4px;
  border-radius: 4px;
  font-weight: 500;
  text-align: center;
  cursor: pointer;
`;
