import {omit, maxBy, range} from 'lodash-es';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import styled, {keyframes} from 'styled-components';

import {PlanProdViewer} from '@root/components/apps/main/gestion/plan_prod_viewer';
import {HTMLDivProps} from '@root/components/core/common';
import {SCROLLBAR_WIDTH} from '@root/components/core/size_monitor';
import {SVGIcon} from '@root/components/core/svg_icon';
import {WithColor} from '@root/components/core/with_colors';
import {bridge} from '@root/lib/bridge';
import {contextMenuManager, ContextMenu} from '@root/lib/context_menu';
import {
  PlanProdBase,
  DonePlanProduction,
  InProgressPlanProduction,
  ScheduledPlanProduction,
} from '@root/lib/plan_prod_order';
import {plansProductionStore} from '@root/stores/list_store';
import {Palette, theme} from '@root/theme';

import {getRefenteLabel} from '@shared/lib/refentes';
import {
  Stock,
  BobineQuantities,
  ClientAppType,
  PlanProduction,
  Operation,
  PlanProductionInfo,
} from '@shared/models';
import {asMap, asNumber} from '@shared/type_utils';

const SHOW_VIEWER_TIMEOUT_MS = 400;

interface Props extends HTMLDivProps {
  date: Date;
  planProd: PlanProdBase;
  stocks: Map<string, Stock[]>;
  cadencier: Map<string, Map<number, number>>;
  bobineQuantities: BobineQuantities[];
  plansProd: PlanProduction[];
  operations: Operation[];
}

export class PlanProdTile extends React.Component<Props> {
  public static displayName = 'PlanProdTile';
  private readonly wrapperRef = React.createRef<HTMLDivElement>();
  private showViewerTimeout: number | undefined;

  public constructor(props: Props) {
    super(props);
  }

  private getViewerId(): string {
    return `calendar-viewer-${this.props.planProd.plan.id}`;
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
    const {planProd, stocks, cadencier, bobineQuantities, operations, plansProd} = this.props;

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
        planProd={planProd.plan}
        width={width}
        bobineQuantities={bobineQuantities}
        cadencier={cadencier}
        stocks={stocks}
        operations={operations}
        plansProd={plansProd}
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

  private newPlanProd(before: boolean): void {
    const {planProd} = this.props;
    bridge
      .createNewPlanProduction((planProd.plan.index || -1) + (before ? 0 : 1))
      .then(data => {
        const id = asNumber(asMap(data).id, 0);
        bridge
          .openApp(ClientAppType.PlanProductionEditorApp, {id, isCreating: true})
          .catch(console.error);
      })
      .catch(console.error);
  }

  private readonly setOperationAtStartOfDay = (newValue: boolean): void => {
    const {planProd} = this.props;
    const newPlanInfo: PlanProductionInfo = {...planProd.plan};
    newPlanInfo.operationAtStartOfDay = newValue;
    bridge
      .updatePlanProductionInfo(planProd.plan.id, newPlanInfo)
      .then(plansProductionStore.refresh)
      .catch(console.error);
  };
  private readonly setProductionAtStartOfDay = (newValue: boolean): void => {
    const {planProd} = this.props;
    const newPlanInfo: PlanProductionInfo = {...planProd.plan};
    newPlanInfo.productionAtStartOfDay = newValue;
    bridge
      .updatePlanProductionInfo(planProd.plan.id, newPlanInfo)
      .then(plansProductionStore.refresh)
      .catch(console.error);
  };

  private deletePlanProd(): void {
    const {planProd} = this.props;
    if (planProd.plan.index !== undefined) {
      bridge
        .deletePlanProduction(planProd.plan.index)
        .then(() => {
          this.removeViewer();
          plansProductionStore.refresh().catch(() => {});
        })
        .catch(console.error);
    }
  }

  private movePlanProd(toIndex: number): void {
    const {planProd} = this.props;
    if (planProd.plan.index) {
      bridge
        .movePlanProduction(planProd.plan.id, planProd.plan.index, toIndex)
        .then(plansProductionStore.refresh)
        .catch(console.error);
    }
  }

  private isToday(time1: number | undefined): boolean {
    if (time1 === undefined) {
      return false;
    }
    const date1 = new Date(time1);
    const date2 = this.props.date;
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  private getHalves(planProd: PlanProdBase): {top: boolean; bottom: boolean} {
    if (planProd.type === 'done') {
      const donePlanProd = planProd as DonePlanProduction;
      return {
        top: this.isToday(donePlanProd.plan.startTime),
        bottom: this.isToday(donePlanProd.plan.endTime),
      };
    }
    if (planProd.type === 'in-progress') {
      const inProgressPlanProd = planProd as InProgressPlanProduction;
      return {
        top: this.isToday(inProgressPlanProd.plan.startTime),
        bottom: this.isToday(inProgressPlanProd.end.getTime()),
      };
    }
    if (planProd.type === 'scheduled') {
      const scheduledPlanProd = planProd as ScheduledPlanProduction;
      return {
        top: this.isToday(scheduledPlanProd.estimatedReglageStart.getTime()),
        bottom: this.isToday(scheduledPlanProd.estimatedProductionEnd.getTime()),
      };
    }
    return {top: false, bottom: false};
  }

  private readonly handleContextMenu = (event: React.MouseEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    const {planProd, plansProd} = this.props;
    if (planProd.type === 'scheduled') {
      const planIndex = planProd.plan.index === undefined ? -1 : planProd.plan.index;
      const lastIndex = plansProd.reduce(
        (acc, curr) => (curr.index !== undefined && curr.index > acc ? curr.index : acc),
        0
      );
      const menus: ContextMenu[] = [];
      menus.push({
        label: 'Nouveau plan de production avant',
        callback: () => this.newPlanProd(true),
      });
      menus.push({
        label: 'Nouveau plan de production après',
        callback: () => this.newPlanProd(false),
      });
      menus.push({
        label: 'Déplacer à la position',
        submenus: range(lastIndex + 1).map(index => ({
          label: `${index < planIndex ? '▲' : index === planIndex ? '   ' : '▼'} n°${index + 1}`,
          disabled: index !== planIndex,
          callback: () => this.movePlanProd(index),
        })),
      });
      if (planProd.plan.operationAtStartOfDay) {
        menus.push({
          label: 'Ne pas forcer les réglages en début de journée',
          callback: () => this.setOperationAtStartOfDay(false),
        });
      } else {
        menus.push({
          label: 'Forcer les réglages en début de journée',
          callback: () => this.setOperationAtStartOfDay(true),
        });
      }
      if (planProd.plan.productionAtStartOfDay) {
        menus.push({
          label: 'Ne pas forcer la production en début de journée',
          callback: () => this.setProductionAtStartOfDay(false),
        });
      } else {
        menus.push({
          label: 'Forcer la production en début de journée',
          callback: () => this.setProductionAtStartOfDay(true),
        });
      }
      menus.push({
        label: 'Supprimer ce plan de production',
        callback: () => this.deletePlanProd(),
      });
      contextMenuManager.open(menus).catch(console.error);
      this.removeViewer();
    }
  };

  private readonly handleClick = (event: React.MouseEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    const {planProd} = this.props;
    if (planProd.type === 'scheduled') {
      bridge
        .openApp(ClientAppType.PlanProductionEditorApp, {id: planProd.plan.id, isCreating: false})
        .catch(console.error);
    }
  };

  private renderIndicator(planProd: PlanProdBase): JSX.Element | undefined {
    if (planProd.type === 'done') {
      return <SVGIcon name="check" width={16} height={16} />;
    }
    if (planProd.type === 'in-progress') {
      return <RotatingSVG name="progress" width={16} height={16} />;
    }
    return <div>{`n°${(planProd.plan.index || 0) + 1}`}</div>;
  }

  private renderPinIcon(planProd: PlanProdBase): JSX.Element | undefined {
    if (planProd.plan.operationAtStartOfDay || planProd.plan.productionAtStartOfDay) {
      return <SVGIcon name="pin" width={16} height={16} />;
    }
    return undefined;
  }

  public render(): JSX.Element {
    const {planProd} = this.props;
    const rest = omit(this.props, ['data', 'ref']);

    return (
      <WithColor color={planProd.plan.data.papier.couleurPapier}>
        {color => {
          const indicator = this.renderIndicator(planProd);
          const content = getRefenteLabel(planProd.plan.data.refente);
          const pinIcon = this.renderPinIcon(planProd);
          const halves = this.getHalves(planProd);
          const style = {borderColor: color.textHex};
          return (
            <TileWrapper
              // tslint:disable-next-line:no-any no-unsafe-any
              ref={this.wrapperRef as any}
              onMouseEnter={() => this.showViewer()}
              onMouseLeave={() => this.removeViewer()}
              onContextMenu={this.handleContextMenu}
              onClick={this.handleClick}
              {...rest}
              style={{
                background: color.backgroundHex,
                color: color.textHex,
                border: `solid 1px ${color.textHex}`,
                borderBottomStyle: !halves.bottom ? 'dashed' : 'solid',
                borderTopStyle: !halves.top ? 'dashed' : 'solid',
              }}
            >
              {indicator ? (
                <TileIndicator style={style}>{indicator}</TileIndicator>
              ) : (
                <React.Fragment />
              )}
              <TileContent>{content}</TileContent>
              {pinIcon ? <TilePin style={style}>{pinIcon}</TilePin> : <React.Fragment />}
            </TileWrapper>
          );
        }}
      </WithColor>
    );
  }
}

const margin = 4;

const TileWrapper = styled.div`
  width: calc(100% - ${2 * margin}px);
  height: 32px;
  box-sizing: border-box;
  margin: 0 ${margin}px ${margin}px ${margin}px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
`;

const TileElement = styled.div`
  height: 32px;
  line-height: 32px;
  text-align: center;
  flex-shrink: 0;
  width: 32px;
`;

const TileIndicator = styled(TileElement)`
  border-right: solid 1px;
`;
const TileContent = styled.div`
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
const TilePin = styled(TileElement)`
  border-left: solid 1px;
`;

const rotate = keyframes`
  from {
    transform: rotate(360deg);
  }
  to {
    transform: rotate(0deg);
  }
`;
const RotatingSVG = styled(SVGIcon)`
  animation: ${rotate} 4s linear infinite;
`;
