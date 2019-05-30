import {uniq, differenceBy, without} from 'lodash-es';

import {
  compatibilityExists,
  refenteHasSpotForBobine,
} from '@root/lib/plan_production/bobines_refentes_compatibility';
import {filterBobinesFillesForSelectedPapier} from '@root/lib/plan_production/filter_for_selected';
import {
  BobineFilleClichePose,
  BobineMerePapier,
  BobineMerePolypro,
  Refente,
} from '@root/lib/plan_production/model';

import {Perfo} from '@shared/models';

export function filterPolyprosForSelectablePapiers(
  selectablePolypros: BobineMerePolypro[],
  selectablePapiers: BobineMerePapier[]
): BobineMerePolypro[] {
  const availableLaizes = uniq(selectablePapiers.map(p => p.laize));
  const newPolypros = selectablePolypros.filter(p => availableLaizes.indexOf(p.laize) !== -1);
  if (newPolypros.length === selectablePolypros.length) {
    return selectablePolypros;
  }
  const dropped = differenceBy(selectablePolypros, newPolypros, 'ref');
  console.log(`filterPolyprosForSelectablePapiers dropping ${dropped.length} Polypros`, dropped);
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
  const dropped = differenceBy(selectablePolypros, newPolypros, 'ref');
  console.log(`filterPolyprosForSelectableRefentes dropping ${dropped.length} Polypros`, dropped);
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
  const dropped = differenceBy(selectablePapiers, newPapiers, 'ref');
  console.log(`filterPapiersForSelectablePolypros dropping ${dropped.length} Papier`, dropped);
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
  const dropped = differenceBy(selectablePapiers, newPapiers, 'ref');
  console.log(`filterPapiersForSelectableRefentes dropping ${dropped.length} Papier`, dropped);
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
  const dropped = differenceBy(selectablePerfos, newPerfos, 'ref');
  console.log(`filterPerfosForSelectableRefentes dropping ${dropped.length} Perfos`, dropped);
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
  const dropped = differenceBy(selectableRefentes, newRefentes, 'ref');
  console.log(`filterRefentesForSelectablePerfos dropping ${dropped.length} Refentes`, dropped);
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
  const dropped = differenceBy(selectableRefentes, newRefentes, 'ref');
  console.log(`filterRefentesForSelectablePapiers dropping ${dropped.length} Refentes`, dropped);
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
  const dropped = differenceBy(selectableRefentes, newRefentes, 'ref');
  console.log(`filterRefentesForSelectablePolypros dropping ${dropped.length} Refentes`, dropped);
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
  const dropped = differenceBy(selectableBobinesFilles, newBobinesFilles, 'ref');
  console.log(
    `filterBobinesFillesForSelectablePapiers dropping ${dropped.length} BobinesFilles`,
    dropped
  );
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
        for (const hash of res.keys()) {
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
  const dropped = differenceBy(selectableBobinesFilles, compatibleSelectableBobines, 'ref');
  console.log(
    `filterBobinesFillesForSelectableRefentesAndSelectedBobines dropping ${
      dropped.length
    } BobinesFilles`,
    dropped
  );
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
  const dropped = differenceBy(selectableRefentes, newRefentes, 'ref');
  console.log(
    `filterRefentesForSelectableBobinesAndSelectedBobines dropping ${dropped.length} Refente`,
    dropped
  );
  return newRefentes;
}

export function filterPapierForRefentesAndSelectableBobinesAndSelectedBobines(
  selectablePapiers: BobineMerePapier[],
  selectableRefentes: Refente[],
  selectableBobinesFilles: BobineFilleClichePose[],
  bobinesFilles: BobineFilleClichePose[]
): BobineMerePapier[] {
  const newPapiers = selectablePapiers.filter(papier => {
    // Check if the selected bobines are compatible with that Papier.
    // Should never happen?
    if (bobinesFilles.length > 0) {
      const firstBobine = bobinesFilles[0];
      if (
        firstBobine.couleurPapier !== papier.couleurPapier ||
        firstBobine.grammage !== papier.grammage
      ) {
        console.log(
          'Passing this papier because the selected bobines does not match the couleurPapier or grammage!',
          papier,
          bobinesFilles
        );
        return false;
      }
    }
    const filteredSelectableBobines = filterBobinesFillesForSelectedPapier(
      selectableBobinesFilles,
      papier,
      false /* debug */
    );
    for (const refente of selectableRefentes) {
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
  const dropped = differenceBy(selectablePapiers, newPapiers, 'ref');
  console.log(
    `filterPapierForRefentesAndSelectableBobinesAndSelectedBobines dropping ${
      dropped.length
    } Papier`,
    dropped
  );
  return newPapiers;
}
