import {uniqueId} from 'lodash-es';
import React from 'react';
import ReactDOM from 'react-dom';

import {MaintenanceModal} from '@root/components/common/maintenance_modal';
import {NonProdModal} from '@root/components/common/non_prod_modal';
import {bridge} from '@root/lib/bridge';
import {contextMenuManager} from '@root/lib/context_menu';
import {getPlanStart} from '@root/lib/schedule_utils';

import {startOfDay, endOfDay} from '@shared/lib/utils';
import {Schedule, ClientAppType} from '@shared/models';

function getNewPlanProdIndexForDate(schedule: Schedule, date: Date): number {
  const dayEnd = endOfDay(date).getTime();
  const lastPlanBeforeOrAtDate = schedule.plans
    .filter(p => {
      const start = getPlanStart(p);
      if (start === undefined) {
        return false;
      }
      return startOfDay(new Date(start)).getTime() <= dayEnd;
    })
    .sort((p1, p2) => p2.planProd.index - p1.planProd.index)[0];
  if (!lastPlanBeforeOrAtDate) {
    return 0;
  }
  return lastPlanBeforeOrAtDate.planProd.index + 1;
}

export function showDayContextMenu(
  schedule: Schedule,
  date: Date,
  onRefreshNeeded: () => void
): void {
  console.log('showDayContextMenu');
  const minEventTime = schedule.lastSpeedTime ? schedule.lastSpeedTime.time : Date.now();
  if (date.getTime() > minEventTime) {
    contextMenuManager
      .open([
        {
          label: `Nouveau plan de production le ${date.toLocaleDateString('fr')}`,
          callback: async () => {
            const planProdIndex = getNewPlanProdIndexForDate(schedule, date);
            const start = startOfDay(date).getTime();
            const end = endOfDay(date).getTime();
            return bridge.createNewPlanProduction(planProdIndex).then(async ({id}) => {
              return bridge.openPlanProdEditorApp(id, start, end, true);
            });
          },
        },
        {
          label: `Ajouter une opération de maintenance le ${date.toLocaleDateString('fr')}`,
          callback: () => showMaintenanceModal(date, onRefreshNeeded),
        },
        {
          label: `Créer une période de non production le ${date.toLocaleDateString('fr')}`,
          callback: () => showNonProdModal(date, onRefreshNeeded),
        },
        {
          label: `Imprimer les plans de production du ${date.toLocaleDateString('fr')}`,
          callback: () => bridge.openApp(ClientAppType.PlanProdPrinterApp, {day: date.getTime()}),
        },
      ])
      .catch(console.error);
  } else {
    contextMenuManager
      .open([
        {
          label: `Imprimer les plans de production du ${date.toLocaleDateString('fr')}`,
          callback: () => bridge.openApp(ClientAppType.PlanProdPrinterApp, {day: date.getTime()}),
        },
      ])
      .catch(console.error);
  }
}

function showModal(createModal: (onDoneCallback: () => void) => JSX.Element): void {
  const id = uniqueId('modal-');
  const modalWrapper = document.createElement('div');
  modalWrapper.id = id;
  document.body.appendChild(modalWrapper);
  ReactDOM.render(
    createModal(() => {
      const toRemove = document.getElementById(id);
      if (toRemove) {
        toRemove.remove();
      }
    }),
    modalWrapper
  );
}

function showMaintenanceModal(date: Date, onRefreshNeeded: () => void): void {
  showModal(onDone => (
    <MaintenanceModal
      date={date}
      onDone={() => {
        onRefreshNeeded();
        onDone();
      }}
    />
  ));
}

function showNonProdModal(date: Date, onRefreshNeeded: () => void): void {
  showModal(onDone => (
    <NonProdModal
      date={date}
      onDone={() => {
        onRefreshNeeded();
        onDone();
      }}
    />
  ));
}
