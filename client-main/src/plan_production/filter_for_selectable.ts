import {countBy, differenceBy, uniq, without} from 'lodash';
import log from 'electron-log';

import {
  getBobineHashCombinaison,
  substractCombinaisons,
} from '@root/plan_production/bobines_hash_combinaison';
import {
  compatibilityExists,
  refenteHasSpotForBobine,
} from '@root/plan_production/bobines_refentes_compatibility';
import {filterBobinesFillesForSelectedPapier} from '@root/plan_production/filter_for_selected';
import {
  BobineFilleClichePose,
  BobineMerePapier,
  BobineMerePolypro,
  Refente,
} from '@root/plan_production/models';

import {Perfo} from '@shared/models';

const DEBUG = false;

export function filterPolyprosForSelectablePapiers(
  selectablePolypros: BobineMerePolypro[],
  selectablePapiers: BobineMerePapier[]
): BobineMerePolypro[] {
  const availableLaizes = uniq(selectablePapiers.map(p => p.laize));
  const newPolypros = selectablePolypros.filter(p => availableLaizes.indexOf(p.laize) !== -1);
  if (newPolypros.length === selectablePolypros.length) {
    return selectablePolypros;
  }
  if (DEBUG) {
    const dropped = differenceBy(selectablePolypros, newPolypros, 'ref');
    log.debug(`filterPolyprosForSelectablePapiers dropping ${dropped.length} Polypros`);
  }
  return newPolypros;
}

export function filterPolyprosForSelectableRefentes(
  selectablePolypros: BobineMerePolypro[],
  selectableRefentes: Refente[]
): BobineMerePolypro[] {
  const availableLaizes = uniq(selectableRefentes.map(p => p.laize));
  const newPolypros = selectablePolypros.filter(p => availableLaizes.indexOf(p.laize) !== -1);
  if (newPolypros.length === selectablePolypros.length) {
    return selectablePolypros;
  }
  if (DEBUG) {
    const dropped = differenceBy(selectablePolypros, newPolypros, 'ref');
    log.debug(`filterPolyprosForSelectableRefentes dropping ${dropped.length} Polypros`);
  }
  return newPolypros;
}

export function filterPapiersForSelectablePolypros(
  selectablePapiers: BobineMerePapier[],
  selectablePolypros: BobineMerePolypro[]
): BobineMerePapier[] {
  const availableLaizes = uniq(selectablePolypros.map(p => p.laize));
  const newPapiers = selectablePapiers.filter(p => availableLaizes.indexOf(p.laize) !== -1);
  if (newPapiers.length === selectablePapiers.length) {
    return selectablePapiers;
  }
  if (DEBUG) {
    const dropped = differenceBy(selectablePapiers, newPapiers, 'ref');
    log.debug(`filterPapiersForSelectablePolypros dropping ${dropped.length} Papier`);
  }
  return newPapiers;
}

export function filterPapiersForSelectableRefentes(
  selectablePapiers: BobineMerePapier[],
  selectableRefentes: Refente[]
): BobineMerePapier[] {
  const availableLaizes = uniq(selectableRefentes.map(r => r.laize));
  const newPapiers = selectablePapiers.filter(p => availableLaizes.indexOf(p.laize) !== -1);
  if (newPapiers.length === selectablePapiers.length) {
    return selectablePapiers;
  }
  if (DEBUG) {
    const dropped = differenceBy(selectablePapiers, newPapiers, 'ref');
    log.debug(`filterPapiersForSelectableRefentes dropping ${dropped.length} Papier`);
  }
  return newPapiers;
}

export function filterPerfosForSelectableRefentes(
  selectablePerfos: Perfo[],
  selectableRefentes: Refente[]
): Perfo[] {
  const availableRefs = uniq(selectableRefentes.map(r => r.refPerfo));
  const newPerfos = selectablePerfos.filter(p => availableRefs.indexOf(p.ref) !== -1);
  if (newPerfos.length === selectablePerfos.length) {
    return selectablePerfos;
  }
  if (DEBUG) {
    const dropped = differenceBy(selectablePerfos, newPerfos, 'ref');
    log.debug(`filterPerfosForSelectableRefentes dropping ${dropped.length} Perfos`);
  }
  return newPerfos;
}

export function filterRefentesForSelectablePerfos(
  selectableRefentes: Refente[],
  selectablePerfos: Perfo[]
): Refente[] {
  const availableRefs = uniq(selectablePerfos.map(p => p.ref));
  const newRefentes = selectableRefentes.filter(p => availableRefs.indexOf(p.refPerfo) !== -1);
  if (newRefentes.length === selectableRefentes.length) {
    return selectableRefentes;
  }
  if (DEBUG) {
    const dropped = differenceBy(selectableRefentes, newRefentes, 'ref');
    log.debug(`filterRefentesForSelectablePerfos dropping ${dropped.length} Refentes`);
  }
  return newRefentes;
}

export function filterRefentesForSelectablePapiers(
  selectableRefentes: Refente[],
  selectablePapiers: BobineMerePapier[]
): Refente[] {
  const availableLaizes = uniq(selectablePapiers.map(p => p.laize));
  const newRefentes = selectableRefentes.filter(p => availableLaizes.indexOf(p.laize) !== -1);
  if (newRefentes.length === selectableRefentes.length) {
    return selectableRefentes;
  }
  if (DEBUG) {
    const dropped = differenceBy(selectableRefentes, newRefentes, 'ref');
    log.debug(`filterRefentesForSelectablePapiers dropping ${dropped.length} Refentes`);
  }
  return newRefentes;
}

export function filterRefentesForSelectablePolypros(
  selectableRefentes: Refente[],
  selectablePolypros: BobineMerePolypro[]
): Refente[] {
  const availableLaizes = uniq(selectablePolypros.map(p => p.laize));
  const newRefentes = selectableRefentes.filter(p => availableLaizes.indexOf(p.laize) !== -1);
  if (newRefentes.length === selectableRefentes.length) {
    return selectableRefentes;
  }
  if (DEBUG) {
    const dropped = differenceBy(selectableRefentes, newRefentes, 'ref');
    log.debug(`filterRefentesForSelectablePolypros dropping ${dropped.length} Refentes`);
  }
  return newRefentes;
}

export function filterBobinesFillesForSelectablePapiers(
  selectableBobinesFilles: BobineFilleClichePose[],
  selectablePapiers: BobineMerePapier[]
): BobineFilleClichePose[] {
  const availableCouleursGrammages = uniq(
    selectablePapiers.map(p => `${p.couleurPapier}-${p.grammage}`)
  );
  const newBobinesFilles = selectableBobinesFilles.filter(
    p => availableCouleursGrammages.indexOf(`${p.couleurPapier}-${p.grammage}`) !== -1
  );
  if (newBobinesFilles.length === selectableBobinesFilles.length) {
    return selectableBobinesFilles;
  }
  if (DEBUG) {
    const dropped = differenceBy(selectableBobinesFilles, newBobinesFilles, 'ref');
    console.log(`filterBobinesFillesForSelectablePapiers dropping ${dropped.length} BobinesFilles`);
  }
  return newBobinesFilles;
}

export function filterBobinesFillesForSelectableRefentesAndSelectedBobines(
  selectableBobinesFilles: BobineFilleClichePose[],
  selectableRefentes: Refente[],
  selectedBobinesFilles: BobineFilleClichePose[]
): BobineFilleClichePose[] {
  const compatibleBobinesFillesHashes = new Map<string, void>();
  for (const bobine of selectableBobinesFilles) {
    if (compatibleBobinesFillesHashes.has(bobine.hash)) {
      continue;
    }
    for (const refente of selectableRefentes) {
      if (!refenteHasSpotForBobine(refente, bobine)) {
        continue;
      }
      const newSelectedBobinesFilles = selectedBobinesFilles.concat([bobine]);
      const newSelectableBobinesFilles = without(selectableBobinesFilles, bobine);
      const res = compatibilityExists(
        newSelectedBobinesFilles,
        newSelectableBobinesFilles,
        refente
      );
      if (res !== undefined) {
        const selectedBobineHashes = getBobineHashCombinaison(
          selectedBobinesFilles.map(b => b.hash)
        );
        const compatibleSelectableHashes = substractCombinaisons(res, selectedBobineHashes);
        for (const hash of compatibleSelectableHashes.keys()) {
          compatibleBobinesFillesHashes.set(hash);
        }
        break;
      }
    }
  }

  const compatibleSelectableBobines = selectableBobinesFilles.filter(b =>
    compatibleBobinesFillesHashes.has(b.hash)
  );
  if (compatibleSelectableBobines.length === selectableBobinesFilles.length) {
    return selectableBobinesFilles;
  }
  if (DEBUG) {
    const dropped = differenceBy(selectableBobinesFilles, compatibleSelectableBobines, 'ref');
    console.log(
      `filterBobinesFillesForSelectableRefentesAndSelectedBobines dropping ${
        dropped.length
      } BobinesFilles`
    );
  }
  return compatibleSelectableBobines;
}

export function filterRefentesForSelectableBobinesAndSelectedBobines(
  selectableRefentes: Refente[],
  selectableBobinesFilles: BobineFilleClichePose[],
  bobinesFilles: BobineFilleClichePose[]
): Refente[] {
  const newRefentes = selectableRefentes.filter(r => {
    return compatibilityExists(bobinesFilles, selectableBobinesFilles, r) !== undefined;
  });
  if (newRefentes.length === selectableRefentes.length) {
    return selectableRefentes;
  }
  if (DEBUG) {
    const dropped = differenceBy(selectableRefentes, newRefentes, 'ref');
    console.log(
      `filterRefentesForSelectableBobinesAndSelectedBobines dropping ${dropped.length} Refente`
    );
  }
  return newRefentes;
}

export function filterPapierForRefentesAndSelectableBobinesAndSelectedBobines(
  selectablePapiers: BobineMerePapier[],
  selectableRefentes: Refente[],
  selectableBobinesFilles: BobineFilleClichePose[],
  bobinesFilles: BobineFilleClichePose[]
): BobineMerePapier[] {
  // We sort the refente to have the ones where it's easy to find a combinaison of bobines first
  const sortedSelectableRefentes = [...selectableRefentes].sort((r1, r2) => {
    if (r1.laizes.length !== r2.laizes.length) {
      return r1.laizes.length - r2.laizes.length; // Less laizes is better
    }
    // Count by number of laize of the same size
    const r1Count = Object.values(countBy(r1.laizes))
      .sort()
      .reverse();
    const r2Count = Object.values(countBy(r2.laizes))
      .sort()
      .reverse();
    while (r1Count.length > 0 && r2Count.length > 0) {
      const firstR1Count = r1Count.shift() || 0;
      const firstR2Count = r2Count.shift() || 0;
      if (firstR1Count !== firstR2Count) {
        return firstR1Count - firstR2Count;
      }
    }
    return 0; // We should never reach here
  });

  const newPapiers = selectablePapiers.filter(papier => {
    // Check if the selected bobines are compatible with that Papier.
    // Should never happen?
    if (bobinesFilles.length > 0) {
      const firstBobine = bobinesFilles[0];
      if (
        firstBobine.couleurPapier !== papier.couleurPapier ||
        firstBobine.grammage !== papier.grammage
      ) {
        // console.log(
        //   'Passing this papier because the selected bobines does not match the couleurPapier or grammage!',
        //   papier,
        //   bobinesFilles
        // );
        return false;
      }
    }
    const filteredSelectableBobines = filterBobinesFillesForSelectedPapier(
      selectableBobinesFilles,
      papier,
      false /* debug */
    );
    for (const refente of sortedSelectableRefentes) {
      // Ensure the refente is compatible with the papier.
      if (refente.laize !== papier.laize) {
        continue;
      }
      if (compatibilityExists(bobinesFilles, filteredSelectableBobines, refente) !== undefined) {
        return true;
      }
    }
    return false;
  });
  if (newPapiers.length === selectablePapiers.length) {
    return selectablePapiers;
  }
  if (DEBUG) {
    const dropped = differenceBy(selectablePapiers, newPapiers, 'ref');
    console.log(
      `filterPapierForRefentesAndSelectableBobinesAndSelectedBobines dropping ${
        dropped.length
      } Papier`
    );
  }
  return newPapiers;
}
