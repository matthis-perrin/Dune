import {omit, maxBy, findIndex} from 'lodash-es';
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
import {getShortPlanProdTitle} from '@root/lib/plan_prod';
import {
  getAllPlannedSchedules,
  getPlanStatus,
  getScheduleStart,
  getScheduleEnd,
} from '@root/lib/schedule_utils';
import {Palette, theme} from '@root/theme';

import {getPoseSize} from '@shared/lib/cliches';
import {dateAtHour} from '@shared/lib/time';
import {
  Stock,
  BobineQuantities,
  ClientAppType,
  PlanProductionInfo,
  ScheduledPlanProd,
  Schedule,
  PlanProductionStatus,
  PlanProdSchedule,
} from '@shared/models';
import {asMap, asNumber} from '@shared/type_utils';

const SHOW_VIEWER_TIMEOUT_MS = 400;

interface Props extends HTMLDivProps {
  date: Date;
  planSchedule: ScheduledPlanProd;
  schedule: Schedule;
  stocks: Map<string, Stock[]>;
  cadencier: Map<string, Map<number, number>>;
  bobineQuantities: BobineQuantities[];
  onPlanProdRefreshNeeded(): void;
}

export class PlanProdTile extends React.Component<Props> {
  public static displayName = 'PlanProdTile';
  private readonly wrapperRef = React.createRef<HTMLDivElement>();
  private showViewerTimeout: number | undefined;

  public constructor(props: Props) {
    super(props);
  }

  private getViewerId(): string {
    return `calendar-viewer-${this.props.planSchedule.planProd.id}`;
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
    const {planSchedule, cadencier, bobineQuantities} = this.props;

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
    const {planSchedule} = this.props;
    bridge
      .createNewPlanProduction((planSchedule.planProd.index || -1) + (before ? 0 : 1))
      .then(data => {
        const id = asNumber(asMap(data).id, 0);
        bridge
          .openApp(ClientAppType.PlanProductionEditorApp, {id, isCreating: true})
          .catch(console.error);
      })
      .catch(console.error);
  }

  private readonly setOperationAtStartOfDay = (newValue: boolean): void => {
    const {planSchedule, onPlanProdRefreshNeeded} = this.props;
    const newPlanInfo: PlanProductionInfo = {...planSchedule.planProd};
    newPlanInfo.operationAtStartOfDay = newValue;
    bridge
      .updatePlanProductionInfo(planSchedule.planProd.id, newPlanInfo)
      .then(onPlanProdRefreshNeeded)
      .catch(console.error);
  };
  private readonly setProductionAtStartOfDay = (newValue: boolean): void => {
    const {planSchedule, onPlanProdRefreshNeeded} = this.props;
    const newPlanInfo: PlanProductionInfo = {...planSchedule.planProd};
    newPlanInfo.productionAtStartOfDay = newValue;
    bridge
      .updatePlanProductionInfo(planSchedule.planProd.id, newPlanInfo)
      .then(onPlanProdRefreshNeeded)
      .catch(console.error);
  };

  private deletePlanProd(): void {
    const {planSchedule, onPlanProdRefreshNeeded} = this.props;
    bridge
      .deletePlanProduction(planSchedule.planProd.index)
      .then(() => {
        this.removeViewer();
        onPlanProdRefreshNeeded();
      })
      .catch(console.error);
  }

  private movePlanProd(toIndex: number): void {
    const {planSchedule, onPlanProdRefreshNeeded} = this.props;
    if (planSchedule.planProd.index) {
      bridge
        .movePlanProduction(planSchedule.planProd.id, planSchedule.planProd.index, toIndex)
        .then(onPlanProdRefreshNeeded)
        .catch(console.error);
    }
  }

  private getHalves(planProd: ScheduledPlanProd): {top: boolean; bottom: boolean} {
    const {date} = this.props;
    const days = Array.from(planProd.schedulePerDay.keys());
    const startOfDay = dateAtHour(date, 0).getTime();

    let top = true;
    let bottom = true;
    days.forEach(d => {
      if (d < startOfDay) {
        top = false;
      } else if (d > startOfDay) {
        bottom = false;
      }
    });
    return {top, bottom};
  }

  private getPlanIndex(): number {
    const {planSchedule, schedule} = this.props;
    const allPlanned = getAllPlannedSchedules(schedule);
    return findIndex(allPlanned, p => p.planProd.id === planSchedule.planProd.id);
  }

  private readonly handleContextMenu = (event: React.MouseEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    const {planSchedule, schedule} = this.props;
    const planType = getPlanStatus(planSchedule);
    const allPlanned = getAllPlannedSchedules(schedule);
    const planIndex = this.getPlanIndex();
    if (planType === PlanProductionStatus.PLANNED) {
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
        submenus: allPlanned.map((plan, index) => ({
          label: `${index < planIndex ? '▲' : index === planIndex ? '   ' : '▼'} n°${index + 1}`,
          disabled: index !== planIndex,
          callback: () => this.movePlanProd(plan.planProd.index),
        })),
      });
      if (planSchedule.planProd.operationAtStartOfDay) {
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
      if (planSchedule.planProd.productionAtStartOfDay) {
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
    const {planSchedule} = this.props;
    const planType = getPlanStatus(planSchedule);
    if (planType === PlanProductionStatus.PLANNED) {
      bridge
        .openApp(ClientAppType.PlanProductionEditorApp, {
          id: planSchedule.planProd.id,
          isCreating: false,
        })
        .catch(console.error);
    }
  };

  private renderIndicator(planProdSchedule: PlanProdSchedule): JSX.Element | undefined {
    if (planProdSchedule.status === PlanProductionStatus.DONE) {
      return <SVGIcon name="check" width={20} height={20} />;
    }
    if (planProdSchedule.status === PlanProductionStatus.IN_PROGRESS) {
      return <RotatingSVG name="progress" width={20} height={20} />;
    }
    if (planProdSchedule.status === PlanProductionStatus.PLANNED) {
      return <SVGIcon name="calendar" width={20} height={20} />;
    }
    return <React.Fragment />;
  }

  private renderPinIcon(planProd: ScheduledPlanProd, color: string): JSX.Element | undefined {
    if (planProd.planProd.operationAtStartOfDay || planProd.planProd.productionAtStartOfDay) {
      return (
        <PinIcon>
          <SVGIcon color={color} name="pin" width={16} height={16} />
        </PinIcon>
      );
    }
    return undefined;
  }

  public render(): JSX.Element {
    const {planSchedule} = this.props;
    const {date} = this.props;
    const startOfDay = dateAtHour(date, 0).getTime();
    const schedule = planSchedule.schedulePerDay.get(startOfDay);
    if (!schedule) {
      return <React.Fragment />;
    }

    const start = getScheduleStart(schedule);
    const end = getScheduleEnd(schedule);

    if (start === undefined || end === undefined) {
      return <React.Fragment />;
    }

    const planProd = planSchedule.planProd;

    const title = getShortPlanProdTitle(planProd.id);
    const tourCount = planProd.data.tourCount;
    const tourCountStr = `${tourCount} tours`;
    const startStr = new Date(start).toLocaleTimeString('fr');
    const endStr = new Date(end).toLocaleTimeString('fr');

    const bobines: {ref: string; count: number}[] = [];
    planProd.data.bobines.forEach(b => {
      const index = bobines.map(bb => bb.ref).indexOf(b.ref);
      const prod = getPoseSize(b.pose) * tourCount;
      if (index === -1) {
        bobines.push({ref: b.ref, count: prod});
      } else {
        bobines[index].count += prod;
      }
    });

    const rest = omit(this.props, ['data', 'ref', 'onPlanProdRefreshNeeded']);

    return (
      <WithColor color={planSchedule.planProd.data.papier.couleurPapier}>
        {color => {
          const indicator = this.renderIndicator(schedule);
          const pinIcon = this.renderPinIcon(planSchedule, color.textHex);
          const halves = this.getHalves(planSchedule);
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
                color: color.textHex,
                borderBottomStyle: !halves.bottom ? 'dashed' : 'solid',
                borderTopStyle: !halves.top ? 'dashed' : 'solid',
              }}
            >
              <TileLeft style={{background: color.backgroundHex}}>
                <TilePlanProdTitle>{title}</TilePlanProdTitle>
              </TileLeft>
              <TileRight>
                <TileTop style={{background: color.backgroundHex}}>{tourCountStr}</TileTop>
                <TileContent>
                  <TileBobineGrid>
                    {bobines.map(({ref, count}) => (
                      <React.Fragment>
                        <TileBobineRef>{ref}</TileBobineRef>
                        <TileBobineProd>{`(+${count})`}</TileBobineProd>
                      </React.Fragment>
                    ))}
                  </TileBobineGrid>
                  <TileInfo>
                    <TileInfoTime>{startStr}</TileInfoTime>
                    <TileInfoTime>{endStr}</TileInfoTime>
                    <TileInfoStatus>{indicator}</TileInfoStatus>
                  </TileInfo>
                </TileContent>
              </TileRight>
              {pinIcon}
            </TileWrapper>
          );
        }}
      </WithColor>
    );
  }
}

const margin = 4;

const TileWrapper = styled.div`
  position: relative;
  width: calc(100% - ${2 * margin}px);
  box-sizing: border-box;
  margin: 0 ${margin}px ${margin}px ${margin}px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  border: solid 1px black;
`;

const TileLeft = styled.div`
  flex-shrink: 0;
  width: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: solid 1px black;
`;
const TilePlanProdTitle = styled.div`
  writing-mode: vertical-rl;
  transform: rotate(-180deg);
`;
const TileRight = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
`;
const TileTop = styled.div`
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: solid 1px black;
`;
const TileContent = styled.div`
  display: flex;
  background-color: ${Palette.White};
  color: ${Palette.Black};
  padding: 6px;
`;
const TileBobineGrid = styled.div`
  display: grid;
  grid-template-columns: auto auto;
  grid-template-rows: repeat(20, auto);
  flex-grow: 1;
  font-size: 14px;
`;
const TileBobineRef = styled.div`
  overflow-x: hidden;
  text-overflow: ellipsis;
`;
const TileBobineProd = styled.div`
  flex-grow: 1;
  text-align: right;
`;
const TileInfo = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  margin-left: 6px;
`;
const TileInfoTime = styled.div`
  flex-shrink: 0;
  height: 24px;
  text-align: right;
`;
const TileInfoStatus = styled.div`
  flex-grow: 1;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
`;
const PinIcon = styled.div`
  position: absolute;
  top: 3px;
  right: 2px;
`;

// const TileElement = styled.div`
//   height: 32px;
//   line-height: 32px;
//   text-align: center;
//   flex-shrink: 0;
//   width: 32px;
// `;

// const TileIndicator = styled(TileElement)`
//   border-right: solid 1px;
// `;
// const TileContent = styled.div`
//   flex-grow: 1;
//   white-space: nowrap;
//   overflow: hidden;
//   text-overflow: ellipsis;
// `;
// const TilePin = styled(TileElement)`
//   border-left: solid 1px;
// `;

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
