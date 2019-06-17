import log from 'electron-log';
import {differenceBy, uniq, without} from 'lodash';

import {
  substractCombinaisons,
  getBobineHashCombinaison,
} from '@root/plan_production/bobines_hash_combinaison';
import {compatibilityExists} from '@root/plan_production/bobines_refentes_compatibility';
import {
  BobineFilleClichePose,
  BobineMerePapier,
  BobineMerePolypro,
  Refente,
} from '@root/plan_production/models';

import {Perfo} from '@shared/models';
import {validColorCombinaison} from '@shared/lib/encrier';

const DEBUG = false;
const DEBUG_BOBINE: string | undefined = undefined;

function printDebugBobine(dropped: BobineFilleClichePose[]): void {
  if (DEBUG_BOBINE) {
    const debugBobineDropped = dropped.filter(d => d.ref === DEBUG_BOBINE);
    if (debugBobineDropped.length > 0) {
      log.debug(
        `including dropping bobine ${DEBUG_BOBINE} for poses: ${debugBobineDropped
          .map(b => b.pose)
          .join(', ')}`
      );
    }
  }
}

export function filterPolyprosForSelectedPapier(
  selectablePolypros: BobineMerePolypro[],
  selectedPapier: BobineMerePapier
): BobineMerePolypro[] {
  const newPolypros = selectablePolypros.filter(p => p.laize === selectedPapier.laize);
  if (newPolypros.length === selectablePolypros.length) {
    return selectablePolypros;
  }

  if (DEBUG) {
    const dropped = differenceBy(selectablePolypros, newPolypros, 'ref');
    log.debug(`filterPolyprosForSelectedPapier dropping ${dropped.length} Polypros`);
  }
  return newPolypros;
}

export function filterPolyprosForSelectedRefente(
  selectablePolypros: BobineMerePolypro[],
  selectedRefente: Refente
): BobineMerePolypro[] {
  const newPolypros = selectablePolypros.filter(p => p.laize === selectedRefente.laize);
  if (newPolypros.length === selectablePolypros.length) {
    return selectablePolypros;
  }

  if (DEBUG) {
    const dropped = differenceBy(selectablePolypros, newPolypros, 'ref');
    log.debug(`filterPolyprosForSelectedRefente dropping ${dropped.length} Polypros`);
  }
  return newPolypros;
}

export function filterPapiersForSelectedPolypro(
  selectablePapiers: BobineMerePapier[],
  selectedPolypro: BobineMerePolypro
): BobineMerePapier[] {
  const newPapiers = selectablePapiers.filter(p => p.laize === selectedPolypro.laize);
  if (newPapiers.length === selectablePapiers.length) {
    return selectablePapiers;
  }

  if (DEBUG) {
    const dropped = differenceBy(selectablePapiers, newPapiers, 'ref');
    log.debug(`filterPapiersForSelectedPolypro dropping ${dropped.length} Papiers`);
  }
  return newPapiers;
}

export function filterPapiersForSelectedRefente(
  selectablePapiers: BobineMerePapier[],
  selectedRefente: Refente
): BobineMerePapier[] {
  const newPapiers = selectablePapiers.filter(p => p.laize === selectedRefente.laize);
  if (newPapiers.length === selectablePapiers.length) {
    return selectablePapiers;
  }

  if (DEBUG) {
    const dropped = differenceBy(selectablePapiers, newPapiers, 'ref');
    log.debug(`filterPapiersForSelectedRefente dropping ${dropped.length} Papiers`);
  }
  return newPapiers;
}

export function filterRefentesForSelectedPerfo(
  selectableRefentes: Refente[],
  selectedPerfo: Perfo
): Refente[] {
  const newRefentes = selectableRefentes.filter(r => r.refPerfo === selectedPerfo.ref);
  if (newRefentes.length === selectableRefentes.length) {
    return selectableRefentes;
  }

  if (DEBUG) {
    const dropped = differenceBy(selectableRefentes, newRefentes, 'ref');
    log.debug(`filterRefentesForSelectedPerfo dropping ${dropped.length} Refentes`);
  }
  return newRefentes;
}

export function filterRefentesForSelectedPapier(
  selectableRefentes: Refente[],
  selectedPapier: BobineMerePapier
): Refente[] {
  const newRefentes = selectableRefentes.filter(r => r.laize === selectedPapier.laize);
  if (newRefentes.length === selectableRefentes.length) {
    return selectableRefentes;
  }

  if (DEBUG) {
    const dropped = differenceBy(selectableRefentes, newRefentes, 'ref');
    log.debug(`filterRefentesForSelectedPapier dropping ${dropped.length} Refentes`);
  }
  return newRefentes;
}

export function filterRefentesForSelectedPolypro(
  selectableRefentes: Refente[],
  selectedPolypro: BobineMerePolypro
): Refente[] {
  const newRefentes = selectableRefentes.filter(r => r.laize === selectedPolypro.laize);
  if (newRefentes.length === selectableRefentes.length) {
    return selectableRefentes;
  }

  if (DEBUG) {
    const dropped = differenceBy(selectableRefentes, newRefentes, 'ref');
    log.debug(`filterRefentesForSelectedPolypro dropping ${dropped.length} Refentes`);
  }
  return newRefentes;
}

export function filterPerfosForSelectedRefente(
  selectablePerfos: Perfo[],
  selectedRefente: Refente
): Perfo[] {
  const newPerfos = selectablePerfos.filter(p => p.ref === selectedRefente.refPerfo);
  if (newPerfos.length === selectablePerfos.length) {
    return selectablePerfos;
  }

  if (DEBUG) {
    const dropped = differenceBy(selectablePerfos, newPerfos, 'ref');
    log.debug(`filterPerfosForSelectedRefente dropping ${dropped.length} Perfos`);
  }
  return newPerfos;
}

export function filterBobinesFillesForSelectedPapier(
  selectableBobinesFilles: BobineFilleClichePose[],
  selectedPapier: BobineMerePapier,
  debug: boolean = true
): BobineFilleClichePose[] {
  const newBobinesFilles = selectableBobinesFilles.filter(
    bobineFille =>
      bobineFille.couleurPapier === selectedPapier.couleurPapier &&
      bobineFille.grammage === selectedPapier.grammage
  );
  if (newBobinesFilles.length === selectableBobinesFilles.length) {
    return selectableBobinesFilles;
  }
  if (debug && DEBUG) {
    const dropped = differenceBy(selectableBobinesFilles, newBobinesFilles, 'ref');
    log.debug(`filterBobinesFillesForSelectedPapier dropping ${dropped.length} BobinesFilles`);
    printDebugBobine(dropped);
  }
  return newBobinesFilles;
}

export function filterPapiersForSelectedBobinesFilles(
  selectablePapiers: BobineMerePapier[],
  selectedBobinesFilles: BobineFilleClichePose[]
): BobineMerePapier[] {
  const couleursBobinesFilles = uniq(selectedBobinesFilles.map(b => b.couleurPapier));
  const grammagesBobinesFilles = uniq(selectedBobinesFilles.map(b => b.grammage));

  if (couleursBobinesFilles.length > 1) {
    throw new Error(
      `Plusieurs bobines filles avec une couleur papier differentes: ${selectedBobinesFilles
        .map(b => `${b.ref}(${b.couleurPapier})`)
        .join(', ')}`
    );
  }
  if (grammagesBobinesFilles.length > 1) {
    throw new Error(
      `Plusieurs bobines filles avec un grammage different: ${selectedBobinesFilles
        .map(b => `${b.ref}(${b.grammage})`)
        .join(', ')}`
    );
  }

  const couleurPapier = couleursBobinesFilles[0];
  const grammage = grammagesBobinesFilles[0];

  const newPapiers = selectablePapiers.filter(
    p => p.couleurPapier === couleurPapier && p.grammage === grammage
  );
  if (newPapiers.length === selectablePapiers.length) {
    return selectablePapiers;
  }
  if (DEBUG) {
    const dropped = differenceBy(selectablePapiers, newPapiers, 'ref');
    log.debug(`filterPapiersForSelectedBobinesFilles dropping ${dropped.length} Papiers`);
  }
  return newPapiers;
}

const MAX_COULEURS_IMPRESSIONS = 3;

export function filterBobinesFillesForSelectedBobinesFilles(
  selectableBobinesFilles: BobineFilleClichePose[],
  selectedBobinesFilles: BobineFilleClichePose[]
): BobineFilleClichePose[] {
  const newBobinesFilles = selectableBobinesFilles.filter((b, i) => {
    return validColorCombinaison(
      selectedBobinesFilles.concat([b]).map(bb => bb.couleursImpression),
      MAX_COULEURS_IMPRESSIONS
    );
  });
  if (newBobinesFilles.length === selectableBobinesFilles.length) {
    return selectableBobinesFilles;
  }
  if (DEBUG) {
    const dropped = differenceBy(selectableBobinesFilles, newBobinesFilles, 'ref');
    log.debug(
      `filterBobinesFillesForSelectedBobinesFilles dropping ${dropped.length} BobinesFilles`
    );
    printDebugBobine(dropped);
  }
  return newBobinesFilles;
}

export function filterBobinesFillesForSelectedRefenteAndBobines(
  selectableBobinesFilles: BobineFilleClichePose[],
  refente: Refente,
  selectedBobinesFilles: BobineFilleClichePose[]
): BobineFilleClichePose[] {
  const compatibleBobinesFillesHashes = new Map<string, void>();
  const notCompatibleBobinesFillesHashes = new Map<string, void>();

  // Check each bobine to see if a compatibility exists
  for (const bobine of selectableBobinesFilles) {
    // if (bobine.laize === 150) {
    //   debugger;
    // }
    // No need to check a bobine if it is already in the compatibile (or not compatible) array
    if (
      compatibleBobinesFillesHashes.has(bobine.hash) ||
      notCompatibleBobinesFillesHashes.has(bobine.hash)
    ) {
      continue;
    }
    // Add the bobine to the already selected bobine
    const newSelectedBobinesFilles = selectedBobinesFilles.concat([bobine]);
    // and remove it from the selectable
    const newSelectableBobinesFilles = without(selectableBobinesFilles, bobine);

    // Check if a compatible combinaison exists with our bobine now in the selected bobines array
    const res = compatibilityExists(newSelectedBobinesFilles, newSelectableBobinesFilles, refente);

    // If there is no compatible combinaison, add the bobine to the array of non-compatible bobines
    if (res === undefined) {
      notCompatibleBobinesFillesHashes.set(bobine.hash);
    } else {
      const selectedBobineHashes = getBobineHashCombinaison(selectedBobinesFilles.map(b => b.hash));
      const compatibleSelectableHashes = substractCombinaisons(res, selectedBobineHashes);
      for (const hash of compatibleSelectableHashes.keys()) {
        compatibleBobinesFillesHashes.set(hash);
      }
    }
  }

  // Once all the bobines have been checked, we filter the array of selectable bobines and only keep the bobines
  // whose hash is in `compatibleBobinesFillesHashes`
  const compatibleBobinesFilles = selectableBobinesFilles.filter(b =>
    compatibleBobinesFillesHashes.has(b.hash)
  );
  if (compatibleBobinesFilles.length === selectableBobinesFilles.length) {
    return selectableBobinesFilles;
  }
  if (DEBUG) {
    const dropped = differenceBy(selectableBobinesFilles, compatibleBobinesFilles, 'ref');
    log.debug(
      `filterBobinesFillesForSelectedRefenteAndBobines dropping ${dropped.length} BobinesFilles`
    );
    printDebugBobine(dropped);
  }
  return compatibleBobinesFilles;
}
