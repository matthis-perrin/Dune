import {SQLITE_DB} from '@root/db';
import {PlanProductionEngine} from '@root/plan_production/engine';

import {listBobinesFilles} from '@shared/db/bobines_filles';
import {listBobinesMeres} from '@shared/db/bobines_meres';
import {listCliches} from '@shared/db/cliches';
import {listPerfos} from '@shared/db/perfos';
import {getNextPlanProductionId, getClosestPlanProdBefore} from '@shared/db/plan_production';
import {listRefentes} from '@shared/db/refentes';
import {PlanProductionData, PlanProduction} from '@shared/models';

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
  ): Promise<void> {
    const [
      bobinesFilles,
      bobinesMeres,
      cliches,
      perfos,
      refentes,
      previousPlanProdRaw,
    ] = await Promise.all([
      listBobinesFilles(SQLITE_DB.Gescom, 0),
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

    this.engines.set(
      id,
      new PlanProductionEngine(
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
      )
    );
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
