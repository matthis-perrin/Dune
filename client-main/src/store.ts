import {SQLITE_DB} from '@root/db';
import {PlanProductionEngine} from '@root/plan_production/engine';

import {listBobinesFilles} from '@shared/db/bobines_filles';
import {listBobinesMeres} from '@shared/db/bobines_meres';
import {listCliches} from '@shared/db/cliches';
import {listPerfos} from '@shared/db/perfos';
import {getNextPlanProductionId} from '@shared/db/plan_production';
import {listRefentes} from '@shared/db/refentes';
import {BaseStore} from '@shared/store';

class PlanProductionStore extends BaseStore {
  private planProductionEngine: PlanProductionEngine | undefined;

  public async createNewPlan(
    year: number,
    month: number,
    day: number,
    indexInDay: number
  ): Promise<number> {
    const [bobinesFilles, bobinesMeres, cliches, perfos, refentes, id] = await Promise.all([
      listBobinesFilles(SQLITE_DB.Gescom, 0),
      listBobinesMeres(SQLITE_DB.Gescom, 0),
      listCliches(SQLITE_DB.Gescom, 0),
      listPerfos(SQLITE_DB.Params, 0),
      listRefentes(SQLITE_DB.Params, 0),
      getNextPlanProductionId(SQLITE_DB.Prod),
    ]);

    this.planProductionEngine = new PlanProductionEngine(
      year,
      month,
      day,
      indexInDay,
      bobinesFilles,
      bobinesMeres,
      cliches,
      refentes,
      perfos,
      () => this.emit()
    );

    return id;
  }

  public getEngine(): PlanProductionEngine | undefined {
    return this.planProductionEngine;
  }
}

export const planProductionStore = new PlanProductionStore();
