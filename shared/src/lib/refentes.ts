import {getPoseSize} from '@shared/lib/cliches';
import {Refente, BobineFilleWithPose} from '@shared/models';

export function getRefenteLaizes(refente: Refente): number[] {
  const {
    laize1 = 0,
    laize2 = 0,
    laize3 = 0,
    laize4 = 0,
    laize5 = 0,
    laize6 = 0,
    laize7 = 0,
  } = refente;
  return [laize1, laize2, laize3, laize4, laize5, laize6, laize7].filter(l => l > 0);
}

export function getRefenteSize(refente: Refente): number {
  const {chute = 0} = refente;
  const SIZE_ADJUST_FROM = 173;
  const SIZE_ADJUST_TO = 173.3;
  const laizes = getRefenteLaizes(refente).map(l => (l === SIZE_ADJUST_FROM ? SIZE_ADJUST_TO : l));
  const size = Math.round(laizes.reduce((prev, l) => prev + l, 0) + chute);
  return size;
}

export function getRefenteLabel(refente: Refente): string {
  const laizes = getRefenteLaizes(refente);
  const refenteValues = laizes.map(l => `${Math.round(l)}`);
  if (refente.chute) {
    refenteValues.push(`(${refente.chute})`);
  }
  return refenteValues.join('-');
}

function applyBobineOnCurrentAtIndex(
  bobine: BobineFilleWithPose,
  current: (BobineFilleWithPose | number)[],
  index: number
): (BobineFilleWithPose | number)[] | undefined {
  const places = [...current];
  for (let i = index; i < index + getPoseSize(bobine.pose); i++) {
    const spot = places[i];
    // Bobine already at this place
    if (typeof spot !== 'number') {
      return undefined;
    }
    // Wrong laize at this spot
    if (spot !== bobine.laize) {
      return undefined;
    }
    places[i] = bobine;
  }
  // All poses fit, now dedup
  return places;
}

function applyBobinesOnLaizes(
  bobines: BobineFilleWithPose[],
  laizes: number[]
): (BobineFilleWithPose | number)[] | undefined {
  let current: (BobineFilleWithPose | number)[] | undefined = laizes;
  let index = 0;
  for (const bobine of bobines) {
    if (!current) {
      return undefined;
    }
    current = applyBobineOnCurrentAtIndex(bobine, current, index);
    index += getPoseSize(bobine.pose);
  }
  return current;
}

function firstBobinePlacementAvailableForLaizes(
  bobines: BobineFilleWithPose[],
  current: (BobineFilleWithPose | number)[]
): (BobineFilleWithPose | number)[] {
  if (bobines.length === 0) {
    return current;
  }
  const firstBobine = bobines[0];
  const restBobines = bobines.slice(1);
  for (let i = 0; i < current.length - getPoseSize(firstBobine.pose) + 1; i++) {
    const newCurrent = applyBobineOnCurrentAtIndex(firstBobine, current, i);
    if (newCurrent !== undefined) {
      return firstBobinePlacementAvailableForLaizes(restBobines, newCurrent);
    }
  }
  throw new Error('No combinaison found');
}

function dedup(placement: (BobineFilleWithPose | number)[]): (BobineFilleWithPose | number)[] {
  const deduped: (BobineFilleWithPose | number)[] = [];
  for (const spot of placement) {
    if (typeof spot === 'number' || deduped.length === 0 || deduped[deduped.length - 1] !== spot) {
      deduped.push(spot);
    }
  }
  return deduped;
}

export function firstBobinePlacementAvailableOnRefente(
  bobines: BobineFilleWithPose[],
  refente: Refente
): (BobineFilleWithPose | number)[] {
  const laizes = getRefenteLaizes(refente)
    .map(l => (l === 142 ? 140 : l))
    .map(l => Math.round(l));
  // Check first if the provided order of bobines works
  const res = applyBobinesOnLaizes(bobines, laizes);
  if (res) {
    return dedup(res);
  }

  // We will try all the possible positions but we start with the largest poses since they are the most restrictive
  // and can fit in the least spaces (makes the algo faster)
  const sortedBobines = [...bobines].sort((b1, b2) => getPoseSize(b2.pose) - getPoseSize(b1.pose));
  const placement = firstBobinePlacementAvailableForLaizes(sortedBobines, laizes);
  return dedup(placement);
}
