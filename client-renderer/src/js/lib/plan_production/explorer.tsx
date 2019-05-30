import {flatten, keyBy, without} from 'lodash-es';

import {
  applyBobinesOnRefenteFromIndex,
  RefenteStatus,
} from '@root/lib/plan_production/bobines_refentes_compatibility';
import {
  ColorRestriction,
  getColorsRestrictionsForBobine,
  checkColorsAreCompatbile,
} from '@root/lib/plan_production/colors_compatibility';
import {getBobineFilleClichePose} from '@root/lib/plan_production/data_extraction/bobine_fille';
import {
  getBobinesMeresPapier,
  getBobinesMeresPolypro,
} from '@root/lib/plan_production/data_extraction/bobine_mere';
import {getRefentes} from '@root/lib/plan_production/data_extraction/refente';
import {
  BobineFilleClichePose,
  BobineMerePapier,
  BobineMerePolypro,
  Refente as RefenteAlgo,
} from '@root/lib/plan_production/model';

import {BobineFille, BobineMere, Cliche, Perfo, Refente as RefenteModel} from '@shared/models';

export class PlanProductionExplorer {
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

  private readonly sortedHashCompletePlanProdCache = new Map<string, void>();
  private readonly allFoundCompletePlanProd: BobineFilleClichePose[][] = [];

  constructor(
    bobinesFilles: BobineFille[],
    bobinesMeres: BobineMere[],
    cliches: Cliche[],
    refentes: RefenteModel[],
    perfos: Perfo[]
  ) {
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
  }

  public test(): void {
    const sortedSelectableBobinesFilles = this.selectableBobinesFilles
      .concat()
      .sort((b1, b2) => b1.hash.localeCompare(b2.hash));

    const rootState = {
      bobinesFilles: [],
      bobinesFillesColorRestrictions: [],
      isComplete: false,
      selectablePolypros: this.selectablePolypros,
      selectablePapiers: this.selectablePapiers,
      selectablePerfos: this.selectablePerfos,
      selectableRefentes: this.selectableRefentes,
      selectableBobinesFilles: sortedSelectableBobinesFilles,
      childStates: [],
    };
    const t1 = Date.now();
    const generated = this.buildChildStates(rootState);
    const t2 = Date.now();
    console.log(`Generated ${generated} in ${t2 - t1}ms`);
    // console.log(rootState);
    console.log(this.sortedHashCompletePlanProdCache);
    console.log(JSON.stringify(this.planProdStateToBobinesTree(rootState), null, 2));
  }

  private bobinesFillesHaveCompatibleCouleursPapierAndGrammage(
    bobines: BobineFilleClichePose[]
  ): boolean {
    // Incompatibility starts with at least 2 bobines
    if (bobines.length <= 1) {
      return true;
    }
    const {couleurPapier, grammage} = bobines[0];
    for (let i = 1; i < bobines.length; i++) {
      const b = bobines[i];
      if (b.couleurPapier !== couleurPapier || b.grammage !== grammage) {
        return false;
      }
    }
    return true;
  }

  private bobinesFillesHaveCompatibleCouleursImpression(bobines: BobineFilleClichePose[]): boolean {
    const bobinesColorRestrictions = bobines.map(getColorsRestrictionsForBobine);
    const MAX_COULEURS_IMPRESSIONS = 3;
    return checkColorsAreCompatbile(bobinesColorRestrictions, MAX_COULEURS_IMPRESSIONS);
  }

  private getSortedHash(bobinesFilles: BobineFilleClichePose[]): string {
    return bobinesFilles
      .map(b => b.hash)
      .sort()
      .join(' / ');
  }

  private completePlanProductionStateHash(planProductionState: PlanProductionState): string {
    if (!planProductionState.isComplete) {
      console.log(planProductionState);
      throw new Error('PlanProductionState is not complete');
    }
    return this.getSortedHash(planProductionState.bobinesFilles);
  }

  private createPlanProductionState(
    bobinesFilles: BobineFilleClichePose[],
    bobinesFillesColorRestrictions: ColorRestriction[],
    previouslySelectablePolypros: BobineMerePolypro[],
    previouslySelectablePapiers: BobineMerePapier[],
    previouslySelectablePerfos: Perfo[],
    previouslySelectableRefentes: RefenteAlgo[],
    selectableBobinesFilles: BobineFilleClichePose[]
  ): PlanProductionState | undefined {
    // To create a new plan production state, we need to generate arrays of selectable
    // polypros, papiers, perfos and refentes from arrays of "previously selectable".
    // In order to make the algorithm efficient and save memory, we try as much as possible to
    // not create new arrays if we don't need to filter anything from it.
    // This function needs to return as early as possible with undefined if we realize one array
    // of the "selectables" is empty, as it means we won't be able to create a valid, complete
    // PlanProduction.

    // As we go over the selectable papier and refentes, we register which laize is
    // available. Later on, we will be able to only keep the papier, refente, and polypro whose
    // laize match at least one papier and one refente.
    const laizesRegistery = new Map<number, {papier: boolean; refente: boolean}>();

    // 1. The first step is to filter the papier based on the couleurPapier and grammage when
    // there is 1 bobine fille selected. We don't need to do it if there are more than one selected,
    // since all the bobines filles selected must have the same couleurPapier and grammage.
    // As an optimization, we use the filtering step to index all the laizes available. This will
    // be useful later.
    let selectablePapiers = previouslySelectablePapiers;
    if (bobinesFilles.length === 1) {
      const {couleurPapier, grammage} = bobinesFilles[0];
      const newSelectablePapiers = previouslySelectablePapiers.filter(p => {
        if (p.couleurPapier === couleurPapier && p.grammage === grammage) {
          // If the papier is valid, add it to the laize registery
          if (!laizesRegistery.has(p.laize)) {
            laizesRegistery.set(p.laize, {papier: false, refente: false});
          }
          laizesRegistery.get(p.laize)!.papier = true;
          return true;
        }
        return false;
      });
      if (newSelectablePapiers.length !== selectablePapiers.length) {
        selectablePapiers = newSelectablePapiers;
      }
      if (selectablePapiers.length === 0) {
        return undefined;
      }
    }

    // 2. Next step is to filter the refente to only keep the one that are compatible
    // with the selected bobines. This is also a good time to check if the plan production
    // is complete (ie.  the bobines are compatible with the refente AND fill it completely)
    let isComplete = false;
    let selectableRefentes = previouslySelectableRefentes;
    const newSelectableRefentes = previouslySelectableRefentes.filter(r => {
      const status = applyBobinesOnRefenteFromIndex(bobinesFilles, r, 0);
      if (status === RefenteStatus.INCOMPATIBLE) {
        return false;
      }
      if (status === RefenteStatus.COMPATIBLE) {
        isComplete = true;
      }
      // If the refente is valid, add it to the laize registery
      if (!laizesRegistery.has(r.laize)) {
        laizesRegistery.set(r.laize, {papier: false, refente: false});
      }
      laizesRegistery.get(r.laize)!.refente = true;
      return true;
    });
    if (newSelectableRefentes.length !== selectableRefentes.length) {
      selectableRefentes = newSelectableRefentes;
      if (selectableRefentes.length === 0) {
        return undefined;
      }

      // 3. In the case where we filtered some refentes, we want to make sure we have updated the laizeRegistry
      // for the selectable papiers (which we won't have done if there is more than one bobines filles
      // selected -- see the step 1).
      if (bobinesFilles.length !== 1) {
        selectablePapiers.forEach(p => {
          if (!laizesRegistery.has(p.laize)) {
            laizesRegistery.set(p.laize, {papier: false, refente: false});
          }
          laizesRegistery.get(p.laize)!.papier = true;
        });
      }
    }

    // 4. In the case where we've filtered the refentes or the papiers, we want to a new filtering step on the
    // papier, polypro, and refente, to only keep the ones that have a laize matching at least one papier and
    // one refente.
    let selectablePolypros = previouslySelectablePolypros;
    if (
      selectableRefentes !== previouslySelectableRefentes ||
      selectablePapiers !== previouslySelectablePapiers
    ) {
      const laizesValidity = new Map<number, void>();
      laizesRegistery.forEach((value, key) => {
        if (value.papier && value.refente) {
          laizesValidity.set(key);
        }
      });
      const filteredSelectablePapiers = selectablePapiers.filter(p => laizesValidity.has(p.laize));
      if (filteredSelectablePapiers.length === 0) {
        return undefined;
      }
      const filteredSelectablePolypros = selectablePolypros.filter(p =>
        laizesValidity.has(p.laize)
      );
      if (filteredSelectablePolypros.length === 0) {
        return undefined;
      }
      const filteredSelectableRefentes = selectableRefentes.filter(p =>
        laizesValidity.has(p.laize)
      );
      if (filteredSelectableRefentes.length === 0) {
        return undefined;
      }
      // Update the "selectable" arrays
      if (filteredSelectablePapiers.length !== selectablePapiers.length) {
        selectablePapiers = filteredSelectablePapiers;
      }
      if (filteredSelectablePolypros.length !== selectablePolypros.length) {
        selectablePolypros = filteredSelectablePolypros;
      }
      if (filteredSelectableRefentes.length !== selectableRefentes.length) {
        selectableRefentes = filteredSelectableRefentes;
      }
    }

    // If the refentes changed, we need to filter the perfo as well
    let selectablePerfos = previouslySelectablePerfos;
    if (selectableRefentes !== previouslySelectableRefentes) {
      const perfoRefs = new Map<string, void>();
      selectableRefentes.forEach(r => {
        perfoRefs.set(r.refPerfo);
      });
      const newSelectablePerfos = previouslySelectablePerfos.filter(p => perfoRefs.has(p.ref));
      if (newSelectablePerfos.length === 0) {
        return undefined;
      }
      if (newSelectablePerfos.length !== selectablePerfos.length) {
        selectablePerfos = newSelectablePerfos;
      }
    }

    return {
      bobinesFilles,
      bobinesFillesColorRestrictions,
      isComplete,
      selectablePolypros,
      selectablePapiers,
      selectablePerfos,
      selectableRefentes,
      selectableBobinesFilles,
      childStates: [],
    };
  }

  // Build the child states of a provided `state` and returns how many where built.
  // If `limit` is specified, stop building child states once that limit is reached.
  private buildChildStates(state: PlanProductionState, limit?: number): number {
    if (limit === 0) {
      return 0;
    }
    let childStateCount = 0;

    // Loop through each selectable bobines filles and try to create a child state with it
    const {
      bobinesFilles,
      bobinesFillesColorRestrictions,
      selectablePolypros,
      selectablePapiers,
      selectablePerfos,
      selectableRefentes,
      selectableBobinesFilles,
    } = state;
    for (const bobine of selectableBobinesFilles) {
      // Duplicate check #1. If we've already used a bobine with the same hash in a valid child state, we skip the bobine
      // since it would only create identical PlanProductionState.
      // We just need to check the last child state generated because selectableBobinesFilles is sorted by hash.
      if (state.childStates.length > 0) {
        const lastChildState = state.childStates[state.childStates.length - 1];
        const lastBobine = lastChildState.bobinesFilles[lastChildState.bobinesFilles.length - 1];
        if (lastBobine.hash === bobine.hash) {
          continue;
        }
      }

      // Duplicate check #2. We won't process this bobine if we have already found a complete PlanProductionState that
      // starts with the same bobines as this current PlanProductionState + the bobine.
      const newBobinesFilles = bobinesFilles.concat([bobine]);
      let hasDuplicate = false;
      const currentHash = this.getSortedHash(newBobinesFilles);
      for (const bobines of this.allFoundCompletePlanProd) {
        if (bobines.length >= newBobinesFilles.length) {
          const hash = this.getSortedHash(bobines.slice(0, newBobinesFilles.length));
          if (hash === currentHash) {
            hasDuplicate = true;
            break;
          }
        }
      }
      if (hasDuplicate) {
        continue;
      }

      // If there already are some bobines filles in the current state, we need to make sure
      // the additional bobine fille is compatible
      let newBobinesColorRestrictions!: ColorRestriction[];
      if (state.bobinesFilles.length > 0) {
        // Check the couleurPapier and grammage with the first bobine fille.
        // This is enough since we ensure all bobines filles have the same one.
        const firstBobine = bobinesFilles[0];
        if (firstBobine.couleurPapier !== bobine.couleurPapier) {
          continue;
        }
        if (firstBobine.grammage !== bobine.grammage) {
          continue;
        }
        // Check that the couleurImpression are compatible
        newBobinesColorRestrictions = bobinesFillesColorRestrictions.concat([
          getColorsRestrictionsForBobine(bobine),
        ]);
        const MAX_COULEURS_IMPRESSIONS = 3;
        if (!checkColorsAreCompatbile(newBobinesColorRestrictions, MAX_COULEURS_IMPRESSIONS)) {
          continue;
        }
      } else {
        newBobinesColorRestrictions = [getColorsRestrictionsForBobine(bobine)];
      }
      // Now we can try to create a PlanProductionState state with that bobine
      const newSelectableBobinesFilles = without(selectableBobinesFilles, bobine);
      const planProductionState = this.createPlanProductionState(
        newBobinesFilles,
        newBobinesColorRestrictions,
        selectablePolypros,
        selectablePapiers,
        selectablePerfos,
        selectableRefentes,
        newSelectableBobinesFilles
      );
      // If we have not been able to create a PlanProductionState, we skip the bobine
      if (!planProductionState) {
        continue;
      }

      // We check if the created PlanProductionState is complete. If it is, we need to increment
      // the child state counter.
      if (planProductionState.isComplete) {
        // Duplicate check #3. If we have already found this PlanProductionState we drop this bobine.
        const hash = this.completePlanProductionStateHash(planProductionState);
        if (this.sortedHashCompletePlanProdCache.has(hash)) {
          continue;
        }
        childStateCount++;

        // Register the plan prod in the global structures
        this.sortedHashCompletePlanProdCache.set(hash);
        this.allFoundCompletePlanProd.push(planProductionState.bobinesFilles);
      }

      // Once it is created, we still need to build its own child states.
      const childStateLimit = limit ? limit - childStateCount : undefined;
      const numberOfChildState = this.buildChildStates(planProductionState, childStateLimit);
      // If there was no child state AND the PlanProductionState is not complete (ie. no complete
      // PlanProductionState could be created with that bobine), we skip the bobine and drop
      // this PlanProductionState
      if (numberOfChildState === 0 && !planProductionState.isComplete) {
        continue;
      }
      // Otherwise, we have a valid PlanProductionState! We can add it to the list of child state.
      state.childStates.push(planProductionState);
      childStateCount += numberOfChildState;
      // If we've reached the limit of child state to build, we can stop here
      if (limit !== undefined && childStateCount >= limit) {
        return childStateCount;
      }
    }
    // If we arrive here, it means we've exhausted all selectable bobines filles and there are
    // no more child state that can be built.
    return childStateCount;
  }

  private planProdStateToBobinesTree(state: PlanProductionState): any[] {
    const tree: any[] = [this.planProdStateToString(state)];
    if (state.childStates.length === 0) {
      return [this.planProdStateToString(state)];
    }
    state.childStates.forEach(s => {
      tree.push(this.planProdStateToBobinesTree(s));
    });
    return tree;
  }

  private planProdStateToString(state: PlanProductionState): string {
    const prefix = state.isComplete ? 'COMPLETE ' : '';
    return prefix + state.bobinesFilles.map(b => b.hash).join(' / ');
  }
}

interface PlanProductionState {
  bobinesFilles: BobineFilleClichePose[];
  bobinesFillesColorRestrictions: ColorRestriction[];
  isComplete: boolean;

  selectablePolypros: BobineMerePolypro[];
  selectablePapiers: BobineMerePapier[];
  selectablePerfos: Perfo[];
  selectableRefentes: RefenteAlgo[];
  selectableBobinesFilles: BobineFilleClichePose[];

  childStates: PlanProductionState[];
}
