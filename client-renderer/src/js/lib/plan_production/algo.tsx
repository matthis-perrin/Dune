import {flatten, keyBy} from 'lodash-es';

import {runTest} from '@root/lib/plan_production/bobines_refentes_compatibility_tests';
import {getBobineFilleClichePose} from '@root/lib/plan_production/data_extraction/bobine_fille';
import {
  getBobinesMeresPapier,
  getBobinesMeresPolypro,
} from '@root/lib/plan_production/data_extraction/bobine_mere';
import {getRefentes} from '@root/lib/plan_production/data_extraction/refente';
import {
  filterPolyprosForSelectablePapiers,
  filterPolyprosForSelectableRefentes,
  filterPapiersForSelectablePolypros,
  filterPapiersForSelectableRefentes,
  filterRefentesForSelectablePerfos,
  filterRefentesForSelectablePapiers,
  filterRefentesForSelectablePolypros,
  filterPerfosForSelectableRefentes,
  filterBobinesFillesForSelectablePapiers,
  filterBobinesFillesForSelectableRefentesAndSelectedBobines,
} from '@root/lib/plan_production/filter_for_selectable';
import {
  filterPolyprosForSelectedPapier,
  filterPolyprosForSelectedRefente,
  filterPapiersForSelectedPolypro,
  filterPapiersForSelectedRefente,
  filterRefentesForSelectedPerfo,
  filterRefentesForSelectedPapier,
  filterRefentesForSelectedPolypro,
  filterPerfosForSelectedRefente,
  filterBobinesFillesForSelectedPapier,
  filterBobinesFillesForSelectedBobinesFilles,
  filterPapiersForSelectedBobinesFilles,
  filterBobinesFillesForSelectedRefenteAndBobines,
} from '@root/lib/plan_production/filter_for_selected';
import {
  BobineFilleClichePose,
  BobineMerePapier,
  BobineMerePolypro,
  Refente as RefenteAlgo,
} from '@root/lib/plan_production/model';

import {BobineFille, BobineMere, Cliche, Perfo, Refente as RefenteModel} from '@shared/models';

export interface PlanProduction {
  polypro?: BobineMerePolypro;
  papier?: BobineMerePapier;
  perfo?: Perfo;
  refente?: RefenteAlgo;
  bobinesFilles: BobineFilleClichePose[];
}

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
  public selectablePolypros: BobineMerePolypro[];
  public selectablePapiers: BobineMerePapier[];
  public selectablePerfos: Perfo[];
  public selectableRefentes: RefenteAlgo[];
  public selectableBobinesFilles: BobineFilleClichePose[];

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

    this.selectablePolypros = bobinesMeresPolypro;
    this.selectablePapiers = bobinesMeresPapier;
    this.selectablePerfos = perfos;
    this.selectableRefentes = refentesAlgo;
    this.selectableBobinesFilles = bobinesClichesPoses;

    this.recalculate();
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
    this.selectablePolypros = this.allPolypros;
    this.selectablePapiers = this.allPapiers;
    this.selectablePerfos = this.allPerfos;
    this.selectableRefentes = this.allRefentes;
    this.selectableBobinesFilles = this.allBobinesFilles;
    const startTime = performance.now();
    this.filterSelectables();
    const endTime = performance.now();
    this.calculationTime = endTime - startTime;
    this.changeHandler();
  }

  private filterSelectables(): void {
    let i = 0;
    const MAX_STEP = 10;

    while (this.filterSelectablesOnce()) {
      i++;
      console.log(`Step ${i}`);
      if (i > MAX_STEP) {
        console.log(`Manual stop after ${MAX_STEP} steps`);
        break;
      }
    }
  }

  // Filter selectables and return true if some items where removed
  private filterSelectablesOnce(): boolean {
    let hasChanged = false;
    const {bobinesFilles, papier, perfo, polypro, refente} = this.planProduction;

    // TODO - Add some tracking to know if some of the filtering logic is just useless.
    // Something like a global variable outside the class :
    //   const hasBeenUsed = {<functionName>: false};
    //   and set to true in the function <functionName> when not returning undefined
    // after the algo has run, check if something is still set to false:
    //   Object.keys(hasBeenUsed).filter(fnName => !hasBeenUsed[fnName])

    // Filtering selectable when something is already selected for
    // - BobineFilleClichePose
    // - Papier
    // - Polypro
    // - Perfo
    // - Refente

    if (papier && this.selectablePapiers.length > 0) {
      hasChanged = true;
      console.log('Empty selectable Papiers because one is already selected');
      this.selectablePapiers = [];
    }
    if (polypro && this.selectablePolypros.length > 0) {
      hasChanged = true;
      console.log('Empty selectable Polypros because one is already selected');
      this.selectablePolypros = [];
    }
    if (perfo && this.selectablePerfos.length > 0) {
      hasChanged = true;
      console.log('Empty selectable Perfos because one is already selected');
      this.selectablePerfos = [];
    }
    if (refente && this.selectableRefentes.length > 0) {
      hasChanged = true;
      console.log('Empty selectable Refentes because one is already selected');
      this.selectableRefentes = [];
    }
    if (bobinesFilles.length > 0) {
      this.selectableBobinesFilles = this.selectableBobinesFilles.filter(b => {
        return bobinesFilles.indexOf(b) === -1;
      });
      console.log('Removing selected Bobines Filles from selectable Bobines Filles');
    }

    // Filtering Polypro against
    // 1. Papier
    // 2. Refente

    let newPolypros: BobineMerePolypro[] | undefined;
    if (papier) {
      newPolypros = filterPolyprosForSelectedPapier(this.selectablePolypros, papier);
    } else {
      newPolypros = filterPolyprosForSelectablePapiers(
        this.selectablePolypros,
        this.selectablePapiers
      );
    }
    if (newPolypros) {
      hasChanged = true;
      this.selectablePolypros = newPolypros;
    }

    newPolypros = undefined;
    if (refente) {
      newPolypros = filterPolyprosForSelectedRefente(this.selectablePolypros, refente);
    } else {
      newPolypros = filterPolyprosForSelectableRefentes(
        this.selectablePolypros,
        this.selectableRefentes
      );
    }
    if (newPolypros) {
      hasChanged = true;
      this.selectablePolypros = newPolypros;
    }

    // Filtering Papier against
    // 1. Polypro
    // 2. BobineFilleClichePose
    // 3. Refente

    let newPapiers: BobineMerePapier[] | undefined;
    if (polypro) {
      newPapiers = filterPapiersForSelectedPolypro(this.selectablePapiers, polypro);
    } else {
      newPapiers = filterPapiersForSelectablePolypros(
        this.selectablePapiers,
        this.selectablePolypros
      );
    }
    if (newPapiers) {
      hasChanged = true;
      this.selectablePapiers = newPapiers;
    }

    newPapiers = undefined;
    if (bobinesFilles.length > 0) {
      newPapiers = filterPapiersForSelectedBobinesFilles(this.selectablePapiers, bobinesFilles);
    }
    if (newPapiers) {
      hasChanged = true;
      this.selectablePapiers = newPapiers;
    }

    newPapiers = undefined;
    if (refente) {
      newPapiers = filterPapiersForSelectedRefente(this.selectablePapiers, refente);
    } else {
      newPapiers = filterPapiersForSelectableRefentes(
        this.selectablePapiers,
        this.selectableRefentes
      );
    }
    if (newPapiers) {
      hasChanged = true;
      this.selectablePapiers = newPapiers;
    }

    // Filtering Refente against
    // 1. Perfo
    // 2. Papier
    // 3. Polypro

    let newRefentes: RefenteAlgo[] | undefined;
    if (perfo) {
      newRefentes = filterRefentesForSelectedPerfo(this.selectableRefentes, perfo);
    } else {
      newRefentes = filterRefentesForSelectablePerfos(
        this.selectableRefentes,
        this.selectablePerfos
      );
    }
    if (newRefentes) {
      hasChanged = true;
      this.selectableRefentes = newRefentes;
    }

    newRefentes = undefined;
    if (papier) {
      newRefentes = filterRefentesForSelectedPapier(this.selectableRefentes, papier);
    } else {
      newRefentes = filterRefentesForSelectablePapiers(
        this.selectableRefentes,
        this.selectablePapiers
      );
    }
    if (newRefentes) {
      hasChanged = true;
      this.selectableRefentes = newRefentes;
    }

    newRefentes = undefined;
    if (polypro) {
      newRefentes = filterRefentesForSelectedPolypro(this.selectableRefentes, polypro);
    } else {
      newRefentes = filterRefentesForSelectablePolypros(
        this.selectableRefentes,
        this.selectablePolypros
      );
    }
    if (newRefentes) {
      hasChanged = true;
      this.selectableRefentes = newRefentes;
    }

    // TODO - See if that helps with performance (might just also be necessary too, but potentially expensive)
    // 4. BobineFilleClichePose (basic check to ensure that at least one bobine fits in the refente somwhere)

    // Filtering Perfo against
    // 1. Refente

    const newPerfos: Perfo[] | undefined = refente
      ? filterPerfosForSelectedRefente(this.selectablePerfos, refente)
      : filterPerfosForSelectableRefentes(this.selectablePerfos, this.selectableRefentes);
    if (newPerfos) {
      hasChanged = true;
      this.selectablePerfos = newPerfos;
    }

    // Filtering BobineFilleClichePose against
    // 1. Papier

    let newBobinesFilles: BobineFilleClichePose[] | undefined;
    if (papier) {
      newBobinesFilles = filterBobinesFillesForSelectedPapier(this.selectableBobinesFilles, papier);
    } else {
      newBobinesFilles = filterBobinesFillesForSelectablePapiers(
        this.selectableBobinesFilles,
        this.selectablePapiers
      );
    }
    if (newBobinesFilles) {
      hasChanged = true;
      this.selectableBobinesFilles = newBobinesFilles;
    }

    // The following processing is costly, so if something has changed during the previous filtering,
    // we stop there and wait for the next cycle in case more filtering can be done (which would make things
    // faster here).

    if (hasChanged) {
      return true;
    }

    // Filtering of BobineFilleClichePose against already selected BobineFilleClichePose colors restriction
    newBobinesFilles = undefined;
    if (bobinesFilles.length > 0) {
      newBobinesFilles = filterBobinesFillesForSelectedBobinesFilles(
        this.selectableBobinesFilles,
        bobinesFilles
      );
    }
    if (newBobinesFilles) {
      hasChanged = true;
      this.selectableBobinesFilles = newBobinesFilles;
    }

    if (hasChanged) {
      return true;
    }

    // Filtering of BobineFilleClichePose to ensure there exist for each at least one combinaison of
    // bobines that fits the refente laizes (or at least one of the refente laizes)
    newBobinesFilles = undefined;
    if (refente) {
      newBobinesFilles = filterBobinesFillesForSelectedRefenteAndBobines(
        this.selectableBobinesFilles,
        refente,
        bobinesFilles
      );
    } else {
      newBobinesFilles = filterBobinesFillesForSelectableRefentesAndSelectedBobines(
        this.selectableBobinesFilles,
        this.selectableRefentes,
        bobinesFilles
      );
    }
    if (newBobinesFilles) {
      hasChanged = true;
      this.selectableBobinesFilles = newBobinesFilles;
    }

    return hasChanged;
  }
}

runTest();
