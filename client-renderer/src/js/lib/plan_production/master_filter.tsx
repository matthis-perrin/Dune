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

import {Perfo} from '@shared/models';

export interface PlanProduction {
  polypro?: BobineMerePolypro;
  papier?: BobineMerePapier;
  perfo?: Perfo;
  refente?: RefenteAlgo;
  bobinesFilles: BobineFilleClichePose[];
}

export interface Selectables {
  selectablePolypros: BobineMerePolypro[];
  selectablePapiers: BobineMerePapier[];
  selectablePerfos: Perfo[];
  selectableRefentes: RefenteAlgo[];
  selectableBobinesFilles: BobineFilleClichePose[];
}

// Given a PlanProduction with some things selected and a bunch of Selectables things that can be selected,
// filter the Selectables to only leave the one that can lead to a valid PlanProduction.
export function filterAll(planProd: PlanProduction, selectables: Selectables): Selectables {
  let i = 0;
  const MAX_STEP = 10;
  let somethingChanged = true;
  let currentSelectable = selectables;

  while (somethingChanged) {
    if (i > MAX_STEP) {
      console.log(`Manual stop after ${MAX_STEP} steps`);
      break;
    }
    const t = Date.now();
    const newSelectables = filterAllOnce(planProd, currentSelectable);
    somethingChanged = selectablesAreDifferent(currentSelectable, newSelectables);
    currentSelectable = newSelectables;
    console.log(`Step ${i} (${Date.now() - t}ms)`);
    i++;
  }

  console.log('Done');

  return currentSelectable;
}

function filterAllOnce(planProd: PlanProduction, selectables: Selectables): Selectables {
  const filtered = {...selectables};
  const {bobinesFilles, papier, perfo, polypro, refente} = planProd;

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

  if (papier && filtered.selectablePapiers.length > 0) {
    console.log('Empty selectable Papiers because one is already selected');
    filtered.selectablePapiers = [];
  }
  if (polypro && filtered.selectablePolypros.length > 0) {
    console.log('Empty selectable Polypros because one is already selected');
    filtered.selectablePolypros = [];
  }
  if (perfo && filtered.selectablePerfos.length > 0) {
    console.log('Empty selectable Perfos because one is already selected');
    filtered.selectablePerfos = [];
  }
  if (refente && filtered.selectableRefentes.length > 0) {
    console.log('Empty selectable Refentes because one is already selected');
    filtered.selectableRefentes = [];
  }
  if (bobinesFilles.length > 0) {
    console.log('Removing selected Bobines Filles from selectable Bobines Filles');
    filtered.selectableBobinesFilles = filtered.selectableBobinesFilles.filter(b => {
      return bobinesFilles.indexOf(b) === -1;
    });
  }

  // Filtering Polypro against
  // 1. Papier
  // 2. Refente

  filtered.selectablePolypros = papier
    ? filterPolyprosForSelectedPapier(filtered.selectablePolypros, papier)
    : filterPolyprosForSelectablePapiers(filtered.selectablePolypros, filtered.selectablePapiers);

  filtered.selectablePolypros = refente
    ? filterPolyprosForSelectedRefente(filtered.selectablePolypros, refente)
    : filterPolyprosForSelectableRefentes(filtered.selectablePolypros, filtered.selectableRefentes);

  // Filtering Papier against
  // 1. Polypro
  // 2. BobineFilleClichePose
  // 3. Refente

  filtered.selectablePapiers = polypro
    ? filterPapiersForSelectedPolypro(filtered.selectablePapiers, polypro)
    : filterPapiersForSelectablePolypros(filtered.selectablePapiers, filtered.selectablePolypros);

  if (bobinesFilles.length > 0) {
    filtered.selectablePapiers = filterPapiersForSelectedBobinesFilles(
      filtered.selectablePapiers,
      bobinesFilles
    );
  }

  filtered.selectablePapiers = refente
    ? filterPapiersForSelectedRefente(filtered.selectablePapiers, refente)
    : filterPapiersForSelectableRefentes(filtered.selectablePapiers, filtered.selectableRefentes);

  // Filtering Refente against
  // 1. Perfo
  // 2. Papier
  // 3. Polypro

  filtered.selectableRefentes = perfo
    ? filterRefentesForSelectedPerfo(filtered.selectableRefentes, perfo)
    : filterRefentesForSelectablePerfos(filtered.selectableRefentes, filtered.selectablePerfos);

  filtered.selectableRefentes = papier
    ? filterRefentesForSelectedPapier(filtered.selectableRefentes, papier)
    : filterRefentesForSelectablePapiers(filtered.selectableRefentes, filtered.selectablePapiers);

  filtered.selectableRefentes = polypro
    ? filterRefentesForSelectedPolypro(filtered.selectableRefentes, polypro)
    : filterRefentesForSelectablePolypros(filtered.selectableRefentes, filtered.selectablePolypros);

  // TODO - See if that helps with performance (might just also be necessary too, but potentially expensive)
  // 4. BobineFilleClichePose (basic check to ensure that at least one bobine fits in the refente somwhere)

  // Filtering Perfo against
  // 1. Refente

  filtered.selectablePerfos = refente
    ? filterPerfosForSelectedRefente(filtered.selectablePerfos, refente)
    : filterPerfosForSelectableRefentes(filtered.selectablePerfos, filtered.selectableRefentes);

  // Filtering BobineFilleClichePose against
  // 1. Papier

  filtered.selectableBobinesFilles = papier
    ? filterBobinesFillesForSelectedPapier(filtered.selectableBobinesFilles, papier)
    : filterBobinesFillesForSelectablePapiers(
        filtered.selectableBobinesFilles,
        filtered.selectablePapiers
      );

  // The following processing is costly, so if something has changed during the previous filtering,
  // we stop there and wait for the next cycle in case more filtering can be done (which would make things
  // faster here).

  if (selectablesAreDifferent(selectables, filtered)) {
    return filtered;
  }

  // Filtering of BobineFilleClichePose against already selected BobineFilleClichePose colors restriction
  if (bobinesFilles.length > 0) {
    filtered.selectableBobinesFilles = filterBobinesFillesForSelectedBobinesFilles(
      filtered.selectableBobinesFilles,
      bobinesFilles
    );
  }

  if (selectablesAreDifferent(selectables, filtered)) {
    return filtered;
  }

  // Filtering of BobineFilleClichePose to ensure there exist for each at least one combinaison of
  // bobines that fits the refente laizes (or at least one of the refente laizes)
  filtered.selectableBobinesFilles = refente
    ? filterBobinesFillesForSelectedRefenteAndBobines(
        filtered.selectableBobinesFilles,
        refente,
        bobinesFilles
      )
    : filterBobinesFillesForSelectableRefentesAndSelectedBobines(
        filtered.selectableBobinesFilles,
        filtered.selectableRefentes,
        bobinesFilles
      );

  return filtered;
}

function selectablesAreDifferent(selectables1: Selectables, selectables2: Selectables): boolean {
  return (
    selectables1.selectableBobinesFilles !== selectables2.selectableBobinesFilles ||
    selectables1.selectablePapiers !== selectables2.selectablePapiers ||
    selectables1.selectablePolypros !== selectables2.selectablePolypros ||
    selectables1.selectableRefentes !== selectables2.selectableRefentes ||
    selectables1.selectablePerfos !== selectables2.selectablePerfos
  );
}
