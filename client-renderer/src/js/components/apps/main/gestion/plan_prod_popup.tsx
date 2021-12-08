import {maxBy} from 'lodash-es';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import {PlanProdViewer} from '@root/components/common/plan_prod_viewer';
import {SCROLLBAR_WIDTH} from '@root/components/core/size_monitor';
import {Palette, theme} from '@root/theme';

import {BobineQuantities, ScheduledPlanProd} from '@shared/models';

const SHOW_VIEWER_TIMEOUT_MS = 400;
export const PlanProdPopupId = 'plan_prod_popup_id';

interface PlanProdPopupProps {
  planSchedule: ScheduledPlanProd;
  cadencier: Map<string, Map<number, number>>;
  bobineQuantities: BobineQuantities[];
  children: JSX.Element;
}

export class PlanProdPopup extends React.Component<PlanProdPopupProps> {
  public static displayName = 'PlanProdPopup';
  private readonly childrenRef = React.createRef<HTMLElement>();
  private showViewerTimeout: number | undefined;

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
    const {planSchedule, cadencier, bobineQuantities} = this.props;

    this.removeViewer();

    const viewerContainer = document.createElement('div');
    viewerContainer.style.position = 'absolute';
    viewerContainer.style.left = '-10000px';
    viewerContainer.style.top = '-10000px';
    viewerContainer.style.pointerEvents = 'none';
    viewerContainer.id = PlanProdPopupId;
    document.body.appendChild(viewerContainer);

    const viewerRef = React.createRef<PlanProdViewer>();

    ReactDOM.render(
      <PlanProdViewer
        ref={viewerRef}
        schedule={planSchedule}
        width={width}
        bobineQuantities={bobineQuantities}
        cadencier={cadencier}
        hideOperationTable
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
    const element = document.getElementById(PlanProdPopupId);
    if (element) {
      element.remove();
    }
  }

  private showViewer(): void {
    console.log('Show Viewer');
    if (this.showViewerTimeout) {
      clearTimeout(this.showViewerTimeout);
    }
    this.getViewerWidthHeightRatio(ratio => {
      const element = this.childrenRef.current;
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
        viewerLeft = left + width + distanceFromTile;
        viewerTop = top + height / 2 - best.height / 2;
      } else if (best.position === 'top') {
        viewerLeft = left + width / 2 - best.width / 2;
        viewerTop = top - distanceFromTile - 2 * viewerPadding - best.height;
      } else if (best.position === 'bottom') {
        viewerLeft = left + width / 2 - best.width / 2;
        viewerTop = top + height + distanceFromTile;
      }

      viewerLeft = Math.max(
        viewerMargin,
        Math.min(availableWidth - best.width + distanceFromTile, viewerLeft)
      );
      viewerTop = Math.max(
        viewerMargin,
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
    const {children} = this.props;
    const childrenWithExtraProps = React.cloneElement(children, {
      ref: this.childrenRef,
      onMouseEnter: () => this.showViewer(),
      onMouseLeave: () => this.removeViewer(),
    });
    return childrenWithExtraProps;
  }
}
