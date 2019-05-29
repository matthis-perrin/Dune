import {uniq, differenceBy, without} from 'lodash-es';

import {
  compatibilityExists,
  refenteHasSpotForBobine,
} from '@root/lib/plan_production/bobines_refentes_compatibility';
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
): BobineMerePolypro[] | undefined {
  const availableLaizes = uniq(selectablePapiers.map(p => p.laize));
  const newPolypros = selectablePolypros.filter(p => availableLaizes.indexOf(p.laize) !== -1);
  if (newPolypros.length === selectablePolypros.length) {
    return undefined;
  }
  const dropped = differenceBy(selectablePolypros, newPolypros, 'ref');
  console.log(`filterPolyprosForSelectablePapiers dropping ${dropped.length} Polypros`, dropped);
  return newPolypros;
}

export function filterPolyprosForSelectableRefentes(
  selectablePolypros: BobineMerePolypro[],
  selectableRefentes: Refente[]
): BobineMerePolypro[] | undefined {
  const availableLaizes = uniq(selectableRefentes.map(p => p.laize));
  const newPolypros = selectablePolypros.filter(p => availableLaizes.indexOf(p.laize) !== -1);
  if (newPolypros.length === selectablePolypros.length) {
    return undefined;
  }
  const dropped = differenceBy(selectablePolypros, newPolypros, 'ref');
  console.log(`filterPolyprosForSelectableRefentes dropping ${dropped.length} Polypros`, dropped);
  return newPolypros;
}

export function filterPapiersForSelectablePolypros(
  selectablePapiers: BobineMerePapier[],
  selectablePolypros: BobineMerePolypro[]
): BobineMerePapier[] | undefined {
  const availableLaizes = uniq(selectablePolypros.map(p => p.laize));
  const newPapiers = selectablePapiers.filter(p => availableLaizes.indexOf(p.laize) !== -1);
  if (newPapiers.length === selectablePapiers.length) {
    return undefined;
  }
  const dropped = differenceBy(selectablePapiers, newPapiers, 'ref');
  console.log(`filterPapiersForSelectablePolypros dropping ${dropped.length} Papier`, dropped);
  return newPapiers;
}

export function filterPapiersForSelectableRefentes(
  selectablePapiers: BobineMerePapier[],
  selectableRefentes: Refente[]
): BobineMerePapier[] | undefined {
  const availableLaizes = uniq(selectableRefentes.map(r => r.laize));
  const newPapiers = selectablePapiers.filter(p => availableLaizes.indexOf(p.laize) !== -1);
  if (newPapiers.length === selectablePapiers.length) {
    return undefined;
  }
  const dropped = differenceBy(selectablePapiers, newPapiers, 'ref');
  console.log(`filterPapiersForSelectableRefentes dropping ${dropped.length} Papier`, dropped);
  return newPapiers;
}

export function filterPerfosForSelectableRefentes(
  selectablePerfos: Perfo[],
  selectableRefentes: Refente[]
): Perfo[] | undefined {
  const availableRefs = uniq(selectableRefentes.map(r => r.refPerfo));
  const newPerfos = selectablePerfos.filter(p => availableRefs.indexOf(p.ref) !== -1);
  if (newPerfos.length === selectablePerfos.length) {
    return undefined;
  }
  const dropped = differenceBy(selectablePerfos, newPerfos, 'ref');
  console.log(`filterPerfosForSelectableRefentes dropping ${dropped.length} Perfos`, dropped);
  return newPerfos;
}

export function filterRefentesForSelectablePerfos(
  selectableRefentes: Refente[],
  selectablePerfos: Perfo[]
): Refente[] | undefined {
  const availableRefs = uniq(selectablePerfos.map(p => p.ref));
  const newRefentes = selectableRefentes.filter(p => availableRefs.indexOf(p.refPerfo) !== -1);
  if (newRefentes.length === selectableRefentes.length) {
    return undefined;
  }
  const dropped = differenceBy(selectableRefentes, newRefentes, 'ref');
  console.log(`filterRefentesForSelectablePerfos dropping ${dropped.length} Refentes`, dropped);
  return newRefentes;
}

export function filterRefentesForSelectablePapiers(
  selectableRefentes: Refente[],
  selectablePapiers: BobineMerePapier[]
): Refente[] | undefined {
  const availableLaizes = uniq(selectablePapiers.map(p => p.laize));
  const newRefentes = selectableRefentes.filter(p => availableLaizes.indexOf(p.laize) !== -1);
  if (newRefentes.length === selectableRefentes.length) {
    return undefined;
  }
  const dropped = differenceBy(selectableRefentes, newRefentes, 'ref');
  console.log(`filterRefentesForSelectablePapiers dropping ${dropped.length} Refentes`, dropped);
  return newRefentes;
}

export function filterRefentesForSelectablePolypros(
  selectableRefentes: Refente[],
  selectablePolypros: BobineMerePolypro[]
): Refente[] | undefined {
  const availableLaizes = uniq(selectablePolypros.map(p => p.laize));
  const newRefentes = selectableRefentes.filter(p => availableLaizes.indexOf(p.laize) !== -1);
  if (newRefentes.length === selectableRefentes.length) {
    return undefined;
  }
  const dropped = differenceBy(selectableRefentes, newRefentes, 'ref');
  console.log(`filterRefentesForSelectablePolypros dropping ${dropped.length} Refentes`, dropped);
  return newRefentes;
}

export function filterBobinesFillesForSelectablePapiers(
  selectableBobinesFilles: BobineFilleClichePose[],
  selectablePapiers: BobineMerePapier[]
): BobineFilleClichePose[] | undefined {
  const availableCouleursGrammages = uniq(
    selectablePapiers.map(p => `${p.couleurPapier}-${p.grammage}`)
  );
  const newBobinesFilles = selectableBobinesFilles.filter(
    p => availableCouleursGrammages.indexOf(`${p.couleurPapier}-${p.grammage}`) !== -1
  );
  if (newBobinesFilles.length === selectableBobinesFilles.length) {
    return undefined;
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
): BobineFilleClichePose[] | undefined {
  let compatibleBobinesFilles: BobineFilleClichePose[] = [];
  for (const bobine of selectableBobinesFilles) {
    if (compatibleBobinesFilles.indexOf(bobine) !== -1) {
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
        compatibleBobinesFilles = compatibleBobinesFilles.concat(res);
        break;
      }
    }
  }

  compatibleBobinesFilles = uniq(
    compatibleBobinesFilles.filter(b => selectedBobinesFilles.indexOf(b) === -1)
  );
  if (compatibleBobinesFilles.length === selectableBobinesFilles.length) {
    return undefined;
  }
  const dropped = differenceBy(selectableBobinesFilles, compatibleBobinesFilles, 'ref');
  console.log(
    `filterBobinesFillesForSelectableRefentesAndSelectedBobines dropping ${
      dropped.length
    } BobinesFilles`,
    dropped
  );
  return compatibleBobinesFilles;
}
