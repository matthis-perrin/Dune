import {SQLITE_DB} from '@root/db';
import {PlanProductionEngine} from '@root/plan_production/engine';

import {listBobinesFilles} from '@shared/db/bobines_filles';
import {listBobinesMeres} from '@shared/db/bobines_meres';
import {listCliches} from '@shared/db/cliches';
import {listPerfos} from '@shared/db/perfos';
import {
  getNextPlanProductionId,
  getClosestPlanProdBefore,
  getPlanProd,
} from '@shared/db/plan_production';
import {listRefentes} from '@shared/db/refentes';
import {PlanProductionData, PlanProduction} from '@shared/models';
import { AllPromise } from '@shared/promise_utils';

class PlanProductionStore {
  private readonly engines = new Map<number, PlanProductionEngine>();
  private listener: ((id: number) => void) | undefined;

  public setListener(listener: (id: number) => void): void {
    this.listener = listener;
  }

  public async createEngine(
    id: number,
    index: number,
    operationAtStartOfDay: boolean,
    productionAtStartOfDay: boolean
  ): Promise<PlanProductionEngine> {
    const [
      bobinesFilles,
      bobinesMeres,
      cliches,
      perfos,
      refentes,
      previousPlanProdRaw,
    ] = await AllPromise([
      listBobinesFilles(SQLITE_DB.Gescom, SQLITE_DB.Params, 0),
      listBobinesMeres(SQLITE_DB.Gescom, 0),
      listCliches(SQLITE_DB.Gescom, 0),
      listPerfos(SQLITE_DB.Params, 0),
      listRefentes(SQLITE_DB.Params, 0),
      getClosestPlanProdBefore(SQLITE_DB.Prod, index),
    ]);

    let previousPlanProd: PlanProduction | undefined;
    if (previousPlanProdRaw) {
      try {
        previousPlanProd = {
          ...previousPlanProdRaw,
          data: JSON.parse(previousPlanProdRaw.data) as PlanProductionData,
        };
      } catch {}
    }
    const engine = new PlanProductionEngine(
      index,
      operationAtStartOfDay,
      productionAtStartOfDay,
      previousPlanProd,
      bobinesFilles,
      bobinesMeres,
      cliches,
      refentes,
      perfos,
      () => {
        if (this.listener) {
          this.listener(id);
        }
      }
    );
    engine.recalculate();
    this.engines.set(id, engine);
    return engine;
  }

  public async openPlan(id: number): Promise<void> {
    const engine = this.engines.get(id);
    if (engine) {
      return;
    }
    const planProd = await getPlanProd(SQLITE_DB.Prod, id);
    if (!planProd) {
      return;
    }
    const {index, operationAtStartOfDay, productionAtStartOfDay} = planProd;
    const newEngine = await this.createEngine(
      id,
      index,
      operationAtStartOfDay,
      productionAtStartOfDay
    );

    try {
      const planProdData = JSON.parse(planProd.data) as PlanProductionData;
      newEngine.load(planProdData);
    } catch {}
  }

  public closePlan(id: number): void {
    this.engines.delete(id);
  }

  public async createNewPlan(index: number): Promise<number> {
    const id = await getNextPlanProductionId(SQLITE_DB.Prod);
    await this.createEngine(id, index, false, false);
    return id;
  }

  public getEngine(id: number): PlanProductionEngine | undefined {
    return this.engines.get(id);
  }
}

export const planProductionStore = new PlanProductionStore();
