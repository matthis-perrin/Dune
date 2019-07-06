import {omit, maxBy} from 'lodash-es';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import styled from 'styled-components';

import {PlanProdViewer} from '@root/components/apps/main/gestion/plan_prod_viewer';
import {HTMLDivProps} from '@root/components/core/common';
import {WithColor} from '@root/components/core/with_colors';

import {getRefenteLabel} from '@shared/lib/refentes';
import {PlanProduction} from '@shared/models';

interface Props extends HTMLDivProps {
  planProd: PlanProduction;
}

const VIEWER_WIDTH_HEIGHT_RATIO = 1.06604;
const VIEWER_FIXED_HEIGHT = 34.25;
const VIEWER_LINE_HEIGHT = 32;

export class PlanProdTile extends React.Component<Props> {
  public static displayName = 'PlanProdTile';
  private readonly wrapperRef = React.createRef<HTMLDivElement>();

  public constructor(props: Props) {
    super(props);
  }

  private getBobinesCount(): number {
    const refMap = new Map<string, void>();
    this.props.planProd.data.bobines.forEach(b => refMap.set(b.ref));
    return refMap.size;
  }

  private getViewerId(): string {
    return `calendar-viewer-${this.props.planProd.id}`;
  }

  private getMaxViewerDimension(
    bobinesCount: number,
    width: number,
    height: number
  ): {width: number; height: number} {
    const heightFromWidth =
      width * VIEWER_WIDTH_HEIGHT_RATIO + VIEWER_FIXED_HEIGHT + VIEWER_LINE_HEIGHT * bobinesCount;
    const widthFromHeight =
      (height - VIEWER_FIXED_HEIGHT - VIEWER_LINE_HEIGHT * bobinesCount) /
      VIEWER_WIDTH_HEIGHT_RATIO;
    if (heightFromWidth < height) {
      return {width, height: heightFromWidth};
    }
    return {width: widthFromHeight, height};
  }

  private showViewer(): void {
    this.hideViewer();

    const element = this.wrapperRef.current;
    if (!element) {
      return;
    }
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const {left, top, width, height} = element.getBoundingClientRect();

    const spaces = [
      {position: 'left', width: left, height: windowHeight},
      {position: 'right', width: windowWidth - left - width, height: windowHeight},
      {position: 'top', width: windowWidth, height: top},
      {position: 'bottom', width: windowWidth, height: windowHeight - top - height},
    ];

    const bobinesCount = this.getBobinesCount();
    const best = maxBy(
      spaces.map(space => ({
        position: space.position,
        ...this.getMaxViewerDimension(bobinesCount, space.width, space.height),
      })),
      space => space.width
    );
    if (!best) {
      return;
    }

    let viewerLeft = 0;
    let viewerTop = 0;

    if (best.position === 'left') {
      viewerLeft = 0;
      viewerTop = top + height / 2 - best.height / 2;
    } else if (best.position === 'right') {
      viewerLeft = left + width;
      viewerTop = top + height / 2 - best.height / 2;
    } else if (best.position === 'top') {
      viewerLeft = left + width / 2 - best.width / 2;
      viewerTop = 0;
    } else if (best.position === 'bottom') {
      viewerLeft = left + width / 2 - best.width / 2;
      viewerTop = top + height;
    }

    viewerLeft = Math.max(0, Math.min(windowWidth - best.width, viewerLeft));
    viewerTop = Math.max(0, Math.min(windowHeight - best.height, viewerTop));

    const viewerContainer = document.createElement('div');
    viewerContainer.style.position = 'absolute';
    viewerContainer.style.left = `${viewerLeft}px`;
    viewerContainer.style.top = `${viewerTop}px`;
    viewerContainer.style.pointerEvents = 'none';
    viewerContainer.id = this.getViewerId();
    document.body.appendChild(viewerContainer);
    ReactDOM.render(
      <PlanProdViewer planProd={this.props.planProd} width={best.width} />,
      viewerContainer
    );
  }

  private hideViewer(): void {
    const element = document.getElementById(this.getViewerId());
    if (element) {
      element.remove();
    }
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
            onMouseLeave={() => this.hideViewer()}
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
`;
