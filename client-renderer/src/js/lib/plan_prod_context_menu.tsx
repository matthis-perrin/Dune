import {findIndex, find} from 'lodash-es';

import {bridge} from '@root/lib/bridge';
import {ContextMenu, contextMenuManager} from '@root/lib/context_menu';
import {getShortPlanProdTitle} from '@root/lib/plan_prod';
import {getAllPlannedSchedules, getPlanStart, getPlanEnd} from '@root/lib/schedule_utils';

import {Schedule, ScheduledPlanProd, ClientAppType, PlanProductionInfo} from '@shared/models';
import {asNumber, asMap} from '@shared/type_utils';

function getPlanIndex(schedule: Schedule, planSchedule: ScheduledPlanProd): number {
  const allPlanned = getAllPlannedSchedules(schedule);
  return findIndex(allPlanned, p => p.planProd.id === planSchedule.planProd.id);
}

function newPlanProd(
  planSchedule: ScheduledPlanProd,
  before: boolean,
  onRefreshNeeded: () => void
): void {
  bridge
    .createNewPlanProduction((planSchedule.planProd.index || -1) + (before ? 0 : 1))
    .then(data => {
      onRefreshNeeded();
      const id = asNumber(asMap(data).id, 0);
      const planStart = getPlanStart(planSchedule);
      const planEnd = getPlanEnd(planSchedule);
      const start = planStart !== undefined ? planStart : 0;
      const end = planEnd !== undefined ? planEnd : 0;
      bridge
        .openApp(ClientAppType.PlanProductionEditorApp, {id, isCreating: true, start, end})
        .catch(console.error);
    })
    .catch(console.error);
}

function setOperationAtStartOfDay(
  planSchedule: ScheduledPlanProd,
  newValue: boolean,
  onRefreshNeeded: () => void
): void {
  const newPlanInfo: PlanProductionInfo = {...planSchedule.planProd};
  newPlanInfo.operationAtStartOfDay = newValue;
  bridge
    .updatePlanProductionInfo(planSchedule.planProd.id, newPlanInfo)
    .then(onRefreshNeeded)
    .catch(console.error);
}
function setProductionAtStartOfDay(
  planSchedule: ScheduledPlanProd,
  newValue: boolean,
  onRefreshNeeded: () => void
): void {
  const newPlanInfo: PlanProductionInfo = {...planSchedule.planProd};
  newPlanInfo.productionAtStartOfDay = newValue;
  bridge
    .updatePlanProductionInfo(planSchedule.planProd.id, newPlanInfo)
    .then(onRefreshNeeded)
    .catch(console.error);
}

function deletePlanProd(planSchedule: ScheduledPlanProd, onRefreshNeeded: () => void): void {
  bridge
    .deletePlanProduction(planSchedule.planProd.index)
    .then(onRefreshNeeded)
    .catch(console.error);
}

function movePlanProd(
  planSchedule: ScheduledPlanProd,
  toIndex: number,
  onRefreshNeeded: () => void
): void {
  if (planSchedule.planProd.index) {
    bridge
      .movePlanProduction(planSchedule.planProd.id, planSchedule.planProd.index, toIndex)
      .then(onRefreshNeeded)
      .catch(console.error);
  }
}

export function showPlanContextMenu(
  schedule: Schedule,
  planId: number,
  onRefreshNeeded: () => void
): void {
  const allPlanned = getAllPlannedSchedules(schedule);

  const planSchedule = find(schedule.plans, p => p.planProd.id === planId);
  if (!planSchedule) {
    return;
  }

  const planIndex = getPlanIndex(schedule, planSchedule);

  const menus: ContextMenu[] = [];
  menus.push({
    label: 'Nouveau plan de production avant',
    callback: () => newPlanProd(planSchedule, true, onRefreshNeeded),
  });
  menus.push({
    label: 'Nouveau plan de production après',
    callback: () => newPlanProd(planSchedule, false, onRefreshNeeded),
  });
  menus.push({
    label: `Déplacer le plan ${getShortPlanProdTitle(planSchedule.planProd.id)}`,
    submenus: allPlanned.map((plan, index) => ({
      label:
        index < planIndex
          ? `avant le plan ${getShortPlanProdTitle(plan.planProd.id)}`
          : index > planIndex
          ? `après le plan ${getShortPlanProdTitle(plan.planProd.id)}`
          : '—',
      disabled: index !== planIndex,
      callback: () => movePlanProd(planSchedule, plan.planProd.index, onRefreshNeeded),
    })),
  });
  if (planSchedule.planProd.operationAtStartOfDay) {
    menus.push({
      label: 'Ne pas forcer les réglages en début de journée',
      callback: () => setOperationAtStartOfDay(planSchedule, false, onRefreshNeeded),
    });
  } else {
    menus.push({
      label: 'Forcer les réglages en début de journée',
      callback: () => setOperationAtStartOfDay(planSchedule, true, onRefreshNeeded),
    });
  }
  if (planSchedule.planProd.productionAtStartOfDay) {
    menus.push({
      label: 'Ne pas forcer la production en début de journée',
      callback: () => setProductionAtStartOfDay(planSchedule, false, onRefreshNeeded),
    });
  } else {
    menus.push({
      label: 'Forcer la production en début de journée',
      callback: () => setProductionAtStartOfDay(planSchedule, true, onRefreshNeeded),
    });
  }
  menus.push({
    label: 'Supprimer ce plan de production',
    callback: () => deletePlanProd(planSchedule, onRefreshNeeded),
  });
  contextMenuManager.open(menus).catch(console.error);
}
