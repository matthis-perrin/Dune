import {flatten, keyBy} from 'lodash-es';

import {runTest} from '@root/lib/plan_production/bobines_refentes_compatibility_tests';
import {getBobineFilleClichePose} from '@root/lib/plan_production/data_extraction/bobine_fille';
import {
  getBobinesMeresPapier,
  getBobinesMeresPolypro,
} from '@root/lib/plan_production/data_extraction/bobine_mere';
import {getRefentes} from '@root/lib/plan_production/data_extraction/refente';
import {filterAll, Selectables, PlanProduction} from '@root/lib/plan_production/master_filter';
import {
  BobineFilleClichePose,
  BobineMerePapier,
  BobineMerePolypro,
  Refente as RefenteAlgo,
} from '@root/lib/plan_production/model';

import {BobineFille, BobineMere, Cliche, Perfo, Refente as RefenteModel} from '@shared/models';

export class PlanProductionEngine {
  public planProduction: PlanProduction;

  // All the elements that can be used in a PlanProduction.
  // Does not account for the constraints given by the current PlanProduction.
  public readonly allPolypros: BobineMerePolypro[];
  public readonly allPapiers: BobineMerePapier[];
  public readonly allPerfos: Perfo[];
  public readonly allRefentes: RefenteAlgo[];
  public readonly allBobinesFilles: BobineFilleClichePose[];

  // All the elements that can be added to the current PlanProduction
  // without violating any contraints.
  public selectables: Selectables;

  public calculationTime: number = 0;

  constructor(
    bobinesFilles: BobineFille[],
    bobinesMeres: BobineMere[],
    cliches: Cliche[],
    refentes: RefenteModel[],
    perfos: Perfo[],
    private readonly changeHandler: () => void
  ) {
    this.planProduction = {bobinesFilles: []};
    const clichesByRef = keyBy(cliches, 'ref');
    const bobinesClichesPoses = flatten(
      bobinesFilles.map(b => getBobineFilleClichePose(b, clichesByRef))
    );
    const bobinesMeresPapier = getBobinesMeresPapier(bobinesMeres);
    const bobinesMeresPolypro = getBobinesMeresPolypro(bobinesMeres);
    const refentesAlgo = getRefentes(refentes);

    this.allPolypros = bobinesMeresPolypro;
    this.allPapiers = bobinesMeresPapier;
    this.allPerfos = perfos;
    this.allRefentes = refentesAlgo;
    this.allBobinesFilles = bobinesClichesPoses;

    this.selectables = this.computeSelectables();
  }

  public setPerfo(perfo?: Perfo): void {
    this.planProduction.perfo = perfo;
    this.recalculate();
  }

  public setRefente(refente?: RefenteAlgo): void {
    this.planProduction.refente = refente;
    this.recalculate();
  }

  public setPapier(papier?: BobineMerePapier): void {
    this.planProduction.papier = papier;
    this.recalculate();
  }

  public setPolypro(polypro?: BobineMerePolypro): void {
    this.planProduction.polypro = polypro;
    this.recalculate();
  }

  public addBobineFille(bobineFille: BobineFilleClichePose): void {
    this.planProduction.bobinesFilles.push(bobineFille);
    this.recalculate();
  }

  public removeBobineFille(bobineFille: BobineFilleClichePose): void {
    this.planProduction.bobinesFilles = this.planProduction.bobinesFilles.filter(
      b => b !== bobineFille
    );
    this.recalculate();
  }

  public getBobineFilleIndexes(ref: string): {b: BobineFilleClichePose; i: number}[] {
    const res: {b: BobineFilleClichePose; i: number}[] = [];
    this.allBobinesFilles.forEach((b, i) => {
      if (b.ref === ref) {
        res.push({b, i});
      }
    });
    return res;
  }

  public recalculate(): void {
    this.selectables = this.computeSelectables();
    this.changeHandler();
  }

  private computeSelectables(): Selectables {
    const startTime = performance.now();
    const res = filterAll(this.planProduction, {
      selectablePolypros: this.allPolypros,
      selectablePapiers: this.allPapiers,
      selectablePerfos: this.allPerfos,
      selectableRefentes: this.allRefentes,
      selectableBobinesFilles: this.allBobinesFilles,
    });
    const endTime = performance.now();
    this.calculationTime = endTime - startTime;
    return res;
  }
}

runTest();
