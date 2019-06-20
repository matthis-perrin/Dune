import * as log from 'electron-log';
import {sum} from 'lodash';

import {db} from '@root/db';

import {listCadencier} from '@shared/db/cadencier';
import {aggregateByMonth, CadencierType} from '@shared/lib/cadencier';
import {Vente, Cadencier as CadencierModel} from '@shared/models';

const WAIT_ON_FAILURE = 200;
const WAIT_ON_SUCCESS = 1000;

class Cadencier {
  private localUpdate = 0;
  private readonly dataById = new Map<string, Vente>();
  private readonly cadencierByBobines = new Map<string, Vente[]>();
  private readonly aggregatedCadencier = new Map<
    string,
    {ventesByMonth: Map<number, number>; localUpdate: number}
  >();

  constructor() {
    this.reload();
  }

  public list(localUpdate: number): CadencierModel[] {
    const res: CadencierModel[] = [];
    this.aggregatedCadencier.forEach((data, ref) => {
      if (data.localUpdate > localUpdate) {
        const ventes: {[key: number]: number} = {};
        data.ventesByMonth.forEach((count, date) => {
          ventes[date] = count;
        });
        res.push({
          bobineRef: ref,
          localUpdate: data.localUpdate,
          ventes,
        });
      }
    });
    return res;
  }

  private reload(): void {
    listCadencier(db, this.localUpdate)
      .then(data => {
        this.handleNewData(data);
        setTimeout(() => this.reload(), WAIT_ON_SUCCESS);
      })
      .catch(err => {
        log.error(err);
        setTimeout(() => this.reload(), WAIT_ON_FAILURE);
      });
  }

  private handleNewData(newData: Vente[]): void {
    if (newData.length === 0) {
      return;
    }
    const firstRun = this.dataById.size === 0;
    const refsToUpdate = new Map<string, void>();
    newData.forEach(vente => {
      if (vente.localUpdate > this.localUpdate) {
        this.localUpdate = vente.localUpdate;
      }
      this.dataById.set(vente.id, vente);
      if (!firstRun) {
        refsToUpdate.set(vente.bobineRef);
      }
    });
    const refs = firstRun ? undefined : Array.from(refsToUpdate.keys());
    this.recomputeCadencierByBobines(refs);
  }

  // Recompute the cadencier for the provided bobines refs. If not specified,
  // recompute for all.
  private recomputeCadencierByBobines(refs?: string[]): void {
    if (refs === undefined) {
      this.cadencierByBobines.clear();
    } else {
      refs.forEach(ref => this.cadencierByBobines.delete(ref));
    }

    this.dataById.forEach(value => {
      if (refs !== undefined && refs.indexOf(value.bobineRef) === -1) {
        return;
      }
      const ventes = this.cadencierByBobines.get(value.bobineRef);
      if (ventes === undefined) {
        this.cadencierByBobines.set(value.bobineRef, [value]);
      } else {
        ventes.push(value);
      }
    });
    this.recomputeAggregatedCadencier(refs);
  }

  // Recompute the aggregated cadencier for the provided bobines refs. If not specified,
  // recompute for all.
  private recomputeAggregatedCadencier(refs?: string[]): void {
    if (refs === undefined) {
      this.aggregatedCadencier.clear();
      this.cadencierByBobines.forEach((ventes, ref) =>
        this.saveVentesToAggregatedCadencier(ref, ventes)
      );
    } else {
      refs.forEach(ref => {
        const ventes = this.cadencierByBobines.get(ref);
        if (ventes === undefined) {
          this.aggregatedCadencier.delete(ref);
        } else {
          this.saveVentesToAggregatedCadencier(ref, ventes);
        }
      });
    }
  }

  private saveVentesToAggregatedCadencier(ref: string, ventes: Vente[]): void {
    const aggregatedByMonth = new Map<number, number>();
    let lastLocalUpdate = 0;
    ventes.forEach(v => {
      if (v.localUpdate > lastLocalUpdate) {
        lastLocalUpdate = v.localUpdate;
      }
    });
    aggregateByMonth(ventes).forEach((bobineVentes, month) => {
      const filtered = bobineVentes.filter(v => v.type === CadencierType.FACTURE_COMPTABILISEE);
      const monthSum = sum(filtered.map(v => v.quantity));
      aggregatedByMonth.set(month, monthSum);
    });
    this.aggregatedCadencier.set(ref, {
      localUpdate: lastLocalUpdate,
      ventesByMonth: aggregatedByMonth,
    });
  }
}

export const cadencier = new Cadencier();
