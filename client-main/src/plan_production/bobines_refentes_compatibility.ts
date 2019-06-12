import {uniqBy, without, sum, findIndex} from 'lodash';

import {BobineHashCombinaison} from '@root/plan_production/bobines_hash_combinaison';
import {compatibilityCache} from '@root/plan_production/bobines_refentes_compatibility_cache';
import {
  checkColorsAreCompatbile,
  getColorsRestrictionsForBobine,
} from '@root/plan_production/colors_compatibility';
import {BobineFilleClichePose, Refente} from '@root/plan_production/models';
import {permutations} from '@root/plan_production/utils';
import {getPoseSize} from '@shared/lib/cliches';

const MAX_COULEURS_IMPRESSIONS = 3;

// This function checks if there is at aleast one combinaison of `BobineFilleClichePose`
// in `selectableBobines` that fits in `refente` given a list of already selected `BobineFilleClichePose`
// provided in `selectedBobines`.
// Returns `undefined` if no combinaison exists. Otherwise returns the first combinaison found.
export function compatibilityExists(
  selectedBobines: BobineFilleClichePose[],
  selectableBobines: BobineFilleClichePose[],
  refente: Refente
): BobineHashCombinaison | undefined {
  // if (
  //   selectedBobines.length >= 2 &&
  //   selectedBobines[0].hash === '173_2_BLEU,ORANGE,NOIR_Y' &&
  //   selectedBobines[1].hash === '173_2_BLEU,ORANGE,NOIR_Y'
  // ) {
  //   debugger;
  // }
  // Check in the cache if we've already found a valid combinaison
  const cachedCombi = compatibilityCache.compatibilityInCache(
    refente,
    selectedBobines,
    selectableBobines
  );
  if (cachedCombi) {
    return cachedCombi;
  }

  // Optimization #1
  // Ensure that each selected bobines filles can be placed somewhere on the refente, otherwise we
  // can already return undefined
  const incompatibleSelectedBobines = selectedBobines.filter(
    b => applyBobinesOnRefente([b], refente) === RefenteStatus.INCOMPATIBLE
  );
  if (selectedBobines.length > 0 && incompatibleSelectedBobines.length > 0) {
    return undefined;
  }

  // Optimization #2
  // Ensure that there is at least one selectable bobine for each type of laize of the refente
  const laizesLeft = analyseLaizesLeftOnRefente(selectedBobines, refente);
  if (laizesLeft) {
    const laizeTypes = laizesLeft.keys();
    for (let laize of laizeTypes) {
      if (findIndex(selectableBobines, {laize}) === -1) {
        return undefined;
      }
    }
  }

  // Optimization #3
  // Filter the selectable bobines filles to make sure we only keep the ones that have at least
  // one valid place on the refente
  const compatibleSelectableBobines = selectableBobines.filter(
    b => applyBobinesOnRefente([b], refente) !== RefenteStatus.INCOMPATIBLE
  );

  // Optimization #4
  // Ensure that the selected bobines filles have compatible colors, otherwise we can already
  // return undefined
  if (
    !checkColorsAreCompatbile(
      selectedBobines.map(getColorsRestrictionsForBobine),
      MAX_COULEURS_IMPRESSIONS
    )
  ) {
    return undefined;
  }

  // TODO - Optimization #5
  // Greedy algorithm before looking for all combinaisons

  if (selectedBobines.length === 0) {
    const res = compatibilityExistsForOrderedBobines([], compatibleSelectableBobines, refente);
    if (res !== undefined) {
      return compatibilityCache.addCompatibility(refente, selectedBobines, res);
    }
  } else {
    const selectedBobinesCombinaison = getSelectedBobinesCombinaison(selectedBobines);
    for (const combi of selectedBobinesCombinaison) {
      const res = compatibilityExistsForOrderedBobines(combi, compatibleSelectableBobines, refente);
      if (res !== undefined) {
        return compatibilityCache.addCompatibility(refente, selectedBobines, res);
      }
    }
  }
  return undefined;
}

export function refenteHasSpotForBobine(refente: Refente, bobine: BobineFilleClichePose): boolean {
  const {laize, pose} = bobine;
  const poseSize = getPoseSize(pose);
  let currentPoseCount = 0;
  for (const refenteLaize of refente.laizes) {
    if (refenteLaize !== laize) {
      currentPoseCount = 0;
      continue;
    }
    currentPoseCount++;
    if (currentPoseCount === poseSize) {
      return true;
    }
  }
  return false;
}

// Analyse and count the laizes available on the refente and substract the one that will be taken
// by the selected bobines.
// Return undefined if the selected bobines are not compatible on the refente
export function analyseLaizesLeftOnRefente(
  selectedBobines: BobineFilleClichePose[],
  refente: Refente
): Map<number, number> | undefined {
  const laizesLeft = new Map<number, number>();
  for (const laize of refente.laizes) {
    const left = laizesLeft.get(laize) || 0;
    laizesLeft.set(laize, left + 1);
  }
  for (const bobine of selectedBobines) {
    const {laize, pose} = bobine;
    const poseSize = getPoseSize(pose);
    if (!laizesLeft.has(laize)) {
      return undefined;
    }
    const left = laizesLeft.get(laize) || 0;
    const newLeft = left - poseSize;
    if (newLeft < 0) {
      return undefined;
    }
    if (newLeft === 0) {
      laizesLeft.delete(laize);
    } else {
      laizesLeft.set(laize, left - poseSize);
    }
  }
  return laizesLeft;
}

function bobinesColorsAreCompatbile(bobines: BobineFilleClichePose[]): boolean {
  return checkColorsAreCompatbile(
    bobines.map(getColorsRestrictionsForBobine),
    MAX_COULEURS_IMPRESSIONS
  );
}

// Same as `compatibilityExists` but without trying all permutation of `selectedBobines`
function compatibilityExistsForOrderedBobines(
  selectedBobines: BobineFilleClichePose[],
  selectableBobines: BobineFilleClichePose[],
  refente: Refente
): BobineFilleClichePose[] | undefined {
  const laizesLeft = analyseLaizesLeftOnRefente(selectedBobines, refente);
  if (!laizesLeft) {
    return undefined;
  }
  const compatibleSelectableBobines = selectableBobines.filter(
    b => laizesLeft.get(b.laize) || 0 >= getPoseSize(b.pose)
  );

  // First we check if the selected bobines can be applied on the refente
  const status = applyBobinesOnRefente(selectedBobines, refente);
  if (status === RefenteStatus.INCOMPATIBLE) {
    return undefined;
  }

  // If there is some kind of compatibility, it's now worth checking the colors
  if (!bobinesColorsAreCompatbile(selectedBobines)) {
    return undefined;
  }

  // Yay! Perfect match, we're done
  if (status === RefenteStatus.COMPATIBLE) {
    return selectedBobines;
  }

  const uniqSelectables = uniqByLaizePoseAndColor(compatibleSelectableBobines);
  for (const selectableBobine of uniqSelectables) {
    const newSelectable = without(compatibleSelectableBobines, selectableBobine);
    // Test with the selectable bobine before and after the selected ones as well as every position in between
    for (let i = 0; i < selectedBobines.length + 1; i++) {
      const newSelected = selectedBobines
        .slice(0, i)
        .concat([selectableBobine].concat(selectedBobines.slice(i)));
      const res = compatibilityExistsForOrderedBobines(newSelected, newSelectable, refente);
      if (res !== undefined) {
        return res;
      }
    }
  }
  return undefined;
}

export function uniqByLaizePoseAndColor(bobines: BobineFilleClichePose[]): BobineFilleClichePose[] {
  return uniqBy(bobines, b => b.hash);
}

export function getSelectedBobinesCombinaison(
  selectedBobines: BobineFilleClichePose[]
): BobineFilleClichePose[][] {
  return uniqBy(permutations(selectedBobines), b =>
    b.map(bb => `${bb.laize}_${getPoseSize(bb.pose)}`).join('-')
  );
}

export enum RefenteStatus {
  INCOMPATIBLE,
  PARTIALLY_COMPATIBLE,
  COMPATIBLE,
}

// Check if we can put the bobine on the laizes at a specific index
export function bobineFitsLaizesAtIndex(
  bobine: BobineFilleClichePose,
  laizes: number[],
  index: number
): boolean {
  const poseSize = getPoseSize(bobine.pose);
  for (let i = index; i < index + poseSize; i++) {
    if (laizes[i] !== bobine.laize) {
      return false;
    }
  }
  return true;
}

// Try to apply a bobine on a sequence of laizes trying all position starting from an index.
// Returns the index of the first spot where the bobine fits or undefined if the bobine does not fit at all
export function applyBobineOnLaizes(
  bobine: BobineFilleClichePose,
  laizes: number[],
  fromIndex: number
): number | undefined {
  const poseSize = getPoseSize(bobine.pose);
  for (let i = fromIndex; i < laizes.length - poseSize + 1; i++) {
    if (bobineFitsLaizesAtIndex(bobine, laizes, i)) {
      return i;
    }
  }
  return undefined;
}

export function applyBobinesOnRefente(
  bobines: BobineFilleClichePose[],
  refente: Refente
): RefenteStatus {
  const bobinesLaizesSum = sum(bobines.map(b => getPoseSize(b.pose)));
  let currentIndex = 0;
  for (let bobine of bobines) {
    const firstIndexThatFits = applyBobineOnLaizes(bobine, refente.laizes, currentIndex);
    if (firstIndexThatFits === undefined) {
      return RefenteStatus.INCOMPATIBLE;
    }
    currentIndex = firstIndexThatFits + bobine.pose;
  }

  if (bobinesLaizesSum === refente.laizes.length) {
    return RefenteStatus.COMPATIBLE;
  }
  return RefenteStatus.PARTIALLY_COMPATIBLE;
}
