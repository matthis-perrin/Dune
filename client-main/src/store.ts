import {db} from '@root/db';
import {PlanProductionEngine} from '@root/plan_production/engine';

import {listBobinesFilles} from '@shared/db/bobines_filles';
import {listBobinesMeres} from '@shared/db/bobines_meres';
import {listCliches} from '@shared/db/cliches';
import {listPerfos} from '@shared/db/perfos';
import {listRefentes} from '@shared/db/refentes';
import {BaseStore} from '@shared/store';

class PlanProductionStore extends BaseStore {
  private planProductionEngine: PlanProductionEngine | undefined;

  public async createNewPlan(day: number, indexInDay: number): Promise<void> {
    const [bobinesFilles, bobinesMeres, cliches, perfos, refentes] = await Promise.all([
      listBobinesFilles(db, 0),
      listBobinesMeres(db, 0),
      listCliches(db, 0),
      listPerfos(db, 0),
      listRefentes(db, 0),
    ]);

    this.planProductionEngine = new PlanProductionEngine(
      day,
      indexInDay,
      bobinesFilles,
      bobinesMeres,
      cliches,
      refentes,
      perfos,
      () => this.emit()
    );
  }

  public getEngine(): PlanProductionEngine | undefined {
    return this.planProductionEngine;
  }
}

export const planProductionStore = new PlanProductionStore();
