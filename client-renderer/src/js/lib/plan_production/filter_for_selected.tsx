import {uniq, differenceBy, without} from 'lodash-es';

import {compatibilityExists} from '@root/lib/plan_production/bobines_refentes_compatibility';
import {
  getColorsRestrictionsForBobine,
  checkColorsAreCompatbile,
} from '@root/lib/plan_production/colors_compatibility';
import {
  BobineFilleClichePose,
  BobineMerePapier,
  BobineMerePolypro,
  Refente,
} from '@root/lib/plan_production/model';

import {Perfo} from '@shared/models';

export function filterPolyprosForSelectedPapier(
  selectablePolypros: BobineMerePolypro[],
  selectedPapier: BobineMerePapier
): BobineMerePolypro[] {
  const newPolypros = selectablePolypros.filter(p => p.laize === selectedPapier.laize);
  if (newPolypros.length === selectablePolypros.length) {
    return selectablePolypros;
  }
  const dropped = differenceBy(selectablePolypros, newPolypros, 'ref');
  console.log(`filterPolyprosForSelectedPapier dropping ${dropped.length} Polypros`, dropped);
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
  const dropped = differenceBy(selectablePolypros, newPolypros, 'ref');
  console.log(`filterPolyprosForSelectedRefente dropping ${dropped.length} Polypros`, dropped);
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
  const dropped = differenceBy(selectablePapiers, newPapiers, 'ref');
  console.log(`filterPapiersForSelectedPolypro dropping ${dropped.length} Papiers`, dropped);
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
  const dropped = differenceBy(selectablePapiers, newPapiers, 'ref');
  console.log(`filterPapiersForSelectedRefente dropping ${dropped.length} Papiers`, dropped);
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
  const dropped = differenceBy(selectableRefentes, newRefentes, 'ref');
  console.log(`filterRefentesForSelectedPerfo dropping ${dropped.length} Refentes`, dropped);
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
  const dropped = differenceBy(selectableRefentes, newRefentes, 'ref');
  console.log(`filterRefentesForSelectedPapier dropping ${dropped.length} Refentes`, dropped);
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
  const dropped = differenceBy(selectableRefentes, newRefentes, 'ref');
  console.log(`filterRefentesForSelectedPolypro dropping ${dropped.length} Refentes`, dropped);
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
  const dropped = differenceBy(selectablePerfos, newPerfos, 'ref');
  console.log(`filterPerfosForSelectedRefente dropping ${dropped.length} Perfos`, dropped);
  return newPerfos;
}

export function filterBobinesFillesForSelectedPapier(
  selectableBobinesFilles: BobineFilleClichePose[],
  selectedPapier: BobineMerePapier
): BobineFilleClichePose[] {
  const newBobinesFilles = selectableBobinesFilles.filter(
    bobineFille =>
      bobineFille.couleurPapier === selectedPapier.couleurPapier &&
      bobineFille.grammage === selectedPapier.grammage
  );
  if (newBobinesFilles.length === selectableBobinesFilles.length) {
    return selectableBobinesFilles;
  }
  const dropped = differenceBy(selectableBobinesFilles, newBobinesFilles, 'ref');
  console.log(
    `filterBobinesFillesForSelectedPapier dropping ${dropped.length} BobinesFilles`,
    dropped
  );
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
  const dropped = differenceBy(selectablePapiers, newPapiers, 'ref');
  console.log(`filterPapiersForSelectedBobinesFilles dropping ${dropped.length} Papiers`, dropped);
  return newPapiers;
}

const MAX_COULEURS_IMPRESSIONS = 3;

export function filterBobinesFillesForSelectedBobinesFilles(
  selectableBobinesFilles: BobineFilleClichePose[],
  selectedBobinesFilles: BobineFilleClichePose[]
): BobineFilleClichePose[] {
  const selectedBobinesFillesColorsRestrictions = selectedBobinesFilles.map(
    getColorsRestrictionsForBobine
  );
  const newBobinesFilles = selectableBobinesFilles.filter(b => {
    const bobineColorsRestrictions = getColorsRestrictionsForBobine(b);
    return checkColorsAreCompatbile(
      selectedBobinesFillesColorsRestrictions.concat([bobineColorsRestrictions]),
      MAX_COULEURS_IMPRESSIONS
    );
  });
  if (newBobinesFilles.length === selectableBobinesFilles.length) {
    return selectableBobinesFilles;
  }
  const dropped = differenceBy(selectableBobinesFilles, newBobinesFilles, 'ref');
  console.log(
    `filterBobinesFillesForSelectedBobinesFilles dropping ${dropped.length} BobinesFilles`,
    dropped
  );
  return newBobinesFilles;
}

export function filterBobinesFillesForSelectedRefenteAndBobines(
  selectableBobinesFilles: BobineFilleClichePose[],
  refente: Refente,
  selectedBobinesFilles: BobineFilleClichePose[]
): BobineFilleClichePose[] {
  const compatibleBobinesFillesHashes = new Map<string, void>();
  const notCompatibleBobinesFillesHashes = new Map<string, void>();

  // let i = 0;
  // let len = selectableBobinesFilles.length;

  // Check each bobine to see if a compatibility exists
  for (const bobine of selectableBobinesFilles) {
    // if (bobine.ref === 'B140098ABPL1' && bobine.pose === 1) {
    //   debugger;
    // }
    // if (bobine.hash === '140_1_BISTRE_N') {
    //   debugger;
    // }
    // No need to check a bobine if it is already in the compatibile (or not compatible) array
    if (
      compatibleBobinesFillesHashes.has(bobine.hash) ||
      notCompatibleBobinesFillesHashes.has(bobine.hash)
    ) {
      continue;
    }
    // i++;
    // console.log(`${i}/${len}`);
    // console.log(JSON.stringify(bobine, undefined, 2));
    // if (i > 6) {
    //   break;
    // }

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
      for (const hash of res.keys()) {
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
  const dropped = differenceBy(selectableBobinesFilles, compatibleBobinesFilles, 'ref');
  console.log(
    `filterBobinesFillesForSelectedRefenteAndBobines dropping ${dropped.length} BobinesFilles`,
    dropped
  );
  return compatibleBobinesFilles;
}
