import {analyseLaizesLeftOnRefente} from '@root/plan_production/bobines_refentes_compatibility';
import {
  filterBobinesFillesForSelectablePapiers,
  filterBobinesFillesForSelectableRefentesAndSelectedBobines,
  filterPapiersForRefentesAndSelectableBobinesAndSelectedBobines,
  filterPapiersForSelectablePolypros,
  filterPapiersForSelectableRefentes,
  filterPerfosForSelectableRefentes,
  filterPolyprosForSelectablePapiers,
  filterPolyprosForSelectableRefentes,
  filterRefentesForSelectableBobinesAndSelectedBobines,
  filterRefentesForSelectablePapiers,
  filterRefentesForSelectablePerfos,
  filterRefentesForSelectablePolypros,
} from '@root/plan_production/filter_for_selectable';
import {
  filterBobinesFillesForSelectedBobinesFilles,
  filterBobinesFillesForSelectedBobinesFillesAndCliches,
  filterBobinesFillesForSelectedPapier,
  filterBobinesFillesForSelectedRefenteAndBobines,
  filterPapiersForSelectedBobinesFilles,
  filterPapiersForSelectedPolypro,
  filterPapiersForSelectedRefente,
  filterPerfosForSelectedRefente,
  filterPolyprosForSelectedPapier,
  filterPolyprosForSelectedRefente,
  filterRefentesForSelectedPapier,
  filterRefentesForSelectedPerfo,
  filterRefentesForSelectedPolypro,
} from '@root/plan_production/filter_for_selected';
import {PlanProduction, Selectables} from '@root/plan_production/models';

import {Cliche} from '@shared/models';

// Given a PlanProduction with some things selected and a bunch of Selectables things that can be selected,
// filter the Selectables to only leave the one that can lead to a valid PlanProduction.
export function filterAll(
  planProd: PlanProduction,
  selectables: Selectables,
  cliches: Map<string, Cliche>,
  nbEncriers: number
): Selectables {
  let i = 0;
  const MAX_STEP = 20;
  let somethingChanged = true;
  let currentSelectable = selectables;

  while (somethingChanged) {
    if (i > MAX_STEP) {
      throw new Error(
        `L'algorithme de création de plan de production semble être bloqué. Arrêt manuel après ${MAX_STEP} étapes de filtrages.`
      );
    }
    // const t = Date.now();
    try {
      const newSelectables = filterAllOnce(planProd, currentSelectable, cliches, nbEncriers);
      somethingChanged = selectablesAreDifferent(currentSelectable, newSelectables);
      currentSelectable = newSelectables;
    } catch (err) {
      console.error(err);
    }
    // console.log(`Step ${i} (${Date.now() - t}ms)`);
    i++;
  }

  // console.log('Done', planProd, currentSelectable);

  return currentSelectable;
}

const DEBUG = false;
let perfTime = Date.now();
function markPerf(label: string): void {
  const now = Date.now();
  if (DEBUG) {
    console.log(label, now - perfTime);
  }
  perfTime = now;
}

function filterAllOnce(
  planProd: PlanProduction,
  selectables: Selectables,
  cliches: Map<string, Cliche>,
  nbEncriers: number
): Selectables {
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

  perfTime = Date.now();

  if (papier && filtered.selectablePapiers.length > 0) {
    // console.log('Empty selectable Papiers because one is already selected');
    filtered.selectablePapiers = [];
  }
  if (polypro && filtered.selectablePolypros.length > 0) {
    // console.log('Empty selectable Polypros because one is already selected');
    filtered.selectablePolypros = [];
  }
  if (perfo && filtered.selectablePerfos.length > 0) {
    // console.log('Empty selectable Perfos because one is already selected');
    filtered.selectablePerfos = [];
  }
  if (refente && filtered.selectableRefentes.length > 0) {
    // console.log('Empty selectable Refentes because one is already selected');
    filtered.selectableRefentes = [];
  }
  if (bobinesFilles.length > 0 && filtered.selectableBobinesFilles.length > 0) {
    const laizesLeft = refente && analyseLaizesLeftOnRefente(bobinesFilles, refente);
    if (laizesLeft && laizesLeft.size === 0) {
      // console.log('Empty selectable Bobines Filles because the refente is filled');
      filtered.selectableBobinesFilles = [];
    } else {
      const newSelectableBobinesFilles = filtered.selectableBobinesFilles.filter(
        b => bobinesFilles.indexOf(b) === -1
      );
      if (newSelectableBobinesFilles.length !== filtered.selectableBobinesFilles.length) {
        filtered.selectableBobinesFilles = newSelectableBobinesFilles;
        // console.log('Removing selected Bobines Filles from selectable Bobines Filles');
      }
    }
  }
  markPerf('Filtered from selected');

  // Filtering Polypro against
  // 1. Papier
  // 2. Refente

  filtered.selectablePolypros = papier
    ? filterPolyprosForSelectedPapier(filtered.selectablePolypros, papier)
    : filterPolyprosForSelectablePapiers(filtered.selectablePolypros, filtered.selectablePapiers);
  markPerf(papier ? 'filterPolyprosForSelectedPapier' : 'filterPolyprosForSelectablePapiers');

  filtered.selectablePolypros = refente
    ? filterPolyprosForSelectedRefente(filtered.selectablePolypros, refente)
    : filterPolyprosForSelectableRefentes(filtered.selectablePolypros, filtered.selectableRefentes);
  markPerf(refente ? 'filterPolyprosForSelectedRefente' : 'filterPolyprosForSelectableRefentes');

  // Filtering Papier against
  // 1. Polypro
  // 2. BobineFilleClichePose
  // 3. Refente

  filtered.selectablePapiers = polypro
    ? filterPapiersForSelectedPolypro(filtered.selectablePapiers, polypro)
    : filterPapiersForSelectablePolypros(filtered.selectablePapiers, filtered.selectablePolypros);
  markPerf(polypro ? 'filterPapiersForSelectedPolypro' : 'filterPapiersForSelectablePolypros');

  if (bobinesFilles.length > 0) {
    filtered.selectablePapiers = filterPapiersForSelectedBobinesFilles(
      filtered.selectablePapiers,
      bobinesFilles
    );
    markPerf('filterPapiersForSelectedBobinesFilles');
  }

  filtered.selectablePapiers = refente
    ? filterPapiersForSelectedRefente(filtered.selectablePapiers, refente)
    : filterPapiersForSelectableRefentes(filtered.selectablePapiers, filtered.selectableRefentes);
  markPerf(refente ? 'filterPapiersForSelectedRefente' : 'filterPapiersForSelectableRefentes');

  // Filtering Refente against
  // 1. Perfo
  // 2. Papier
  // 3. Polypro

  filtered.selectableRefentes = perfo
    ? filterRefentesForSelectedPerfo(filtered.selectableRefentes, perfo)
    : filterRefentesForSelectablePerfos(filtered.selectableRefentes, filtered.selectablePerfos);
  markPerf(perfo ? 'filterRefentesForSelectedPerfo' : 'filterRefentesForSelectablePerfos');

  filtered.selectableRefentes = papier
    ? filterRefentesForSelectedPapier(filtered.selectableRefentes, papier)
    : filterRefentesForSelectablePapiers(filtered.selectableRefentes, filtered.selectablePapiers);
  markPerf(papier ? 'filterRefentesForSelectedPapier' : 'filterRefentesForSelectablePapiers');

  filtered.selectableRefentes = polypro
    ? filterRefentesForSelectedPolypro(filtered.selectableRefentes, polypro)
    : filterRefentesForSelectablePolypros(filtered.selectableRefentes, filtered.selectablePolypros);
  markPerf(polypro ? 'filterRefentesForSelectedPolypro' : 'filterRefentesForSelectablePolypros');

  // TODO - See if that helps with performance (might just also be necessary too, but potentially expensive)
  // 4. BobineFilleClichePose (basic check to ensure that at least one bobine fits in the refente somwhere)

  // Filtering Perfo against
  // 1. Refente

  filtered.selectablePerfos = refente
    ? filterPerfosForSelectedRefente(filtered.selectablePerfos, refente)
    : filterPerfosForSelectableRefentes(filtered.selectablePerfos, filtered.selectableRefentes);
  markPerf(refente ? 'filterPerfosForSelectedRefente' : 'filterPerfosForSelectableRefentes');

  // Filtering BobineFilleClichePose against
  // 1. Papier

  filtered.selectableBobinesFilles = papier
    ? filterBobinesFillesForSelectedPapier(filtered.selectableBobinesFilles, papier)
    : filterBobinesFillesForSelectablePapiers(
        filtered.selectableBobinesFilles,
        filtered.selectablePapiers
      );
  markPerf(
    papier ? 'filterBobinesFillesForSelectedPapier' : 'filterBobinesFillesForSelectablePapiers'
  );

  // Filtering of BobineFilleClichePose against already selected BobineFilleClichePose cliches
  if (bobinesFilles.length > 0) {
    filtered.selectableBobinesFilles = filterBobinesFillesForSelectedBobinesFillesAndCliches(
      filtered.selectableBobinesFilles,
      bobinesFilles,
      cliches
    );
    markPerf('filterBobinesFillesForSelectedBobinesFillesAndCliches');
  }

  //
  // The following processing is costly, so if something has changed during the previous filtering,
  // we stop there and wait for the next cycle in case more filtering can be done (which would make things
  // faster here).
  //

  if (selectablesAreDifferent(selectables, filtered)) {
    return filtered;
  }

  // Filtering of BobineFilleClichePose against already selected BobineFilleClichePose colors restriction
  if (bobinesFilles.length > 0) {
    filtered.selectableBobinesFilles = filterBobinesFillesForSelectedBobinesFilles(
      filtered.selectableBobinesFilles,
      bobinesFilles,
      nbEncriers
    );
    markPerf('filterBobinesFillesForSelectedBobinesFilles');
  }

  if (selectablesAreDifferent(selectables, filtered)) {
    return filtered;
  }

  // Filtering of Refente to ensure there is at least one combinaison of bobines that fits it
  if (!refente) {
    filtered.selectableRefentes = filterRefentesForSelectableBobinesAndSelectedBobines(
      filtered.selectableRefentes,
      filtered.selectableBobinesFilles,
      bobinesFilles,
      nbEncriers
    );
    markPerf('filterRefentesForSelectableBobinesAndSelectedBobines');

    if (selectablesAreDifferent(selectables, filtered)) {
      return filtered;
    }
  }

  // Filtering of Papier to ensure there is at least one combinaison of bobines that fits it in at least one
  // refente that is compatible with the Papier laize
  if (!papier) {
    filtered.selectablePapiers = filterPapiersForRefentesAndSelectableBobinesAndSelectedBobines(
      filtered.selectablePapiers,
      refente ? [refente] : filtered.selectableRefentes,
      filtered.selectableBobinesFilles,
      bobinesFilles,
      nbEncriers
    );
    markPerf('filterPapiersForRefentesAndSelectableBobinesAndSelectedBobines');

    if (selectablesAreDifferent(selectables, filtered)) {
      return filtered;
    }
  }

  // Filtering of BobineFilleClichePose to ensure there exist for each at least one combinaison of
  // bobines that fits the refente (or at least one of the refente if none are selected)
  filtered.selectableBobinesFilles = refente
    ? filterBobinesFillesForSelectedRefenteAndBobines(
        filtered.selectableBobinesFilles,
        refente,
        bobinesFilles,
        nbEncriers
      )
    : filterBobinesFillesForSelectableRefentesAndSelectedBobines(
        filtered.selectableBobinesFilles,
        filtered.selectableRefentes,
        papier ? [papier] : filtered.selectablePapiers,
        bobinesFilles,
        nbEncriers
      );
  markPerf(
    refente
      ? 'filterBobinesFillesForSelectedRefenteAndBobines'
      : 'filterBobinesFillesForSelectableRefentesAndSelectedBobines'
  );

  if (selectablesAreDifferent(selectables, filtered)) {
    return filtered;
  }

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
