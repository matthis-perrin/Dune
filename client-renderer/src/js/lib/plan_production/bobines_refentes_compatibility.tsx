import {uniqBy, without, sum} from 'lodash-es';

import {BobineHashCombinaison} from '@root/lib/plan_production/bobines_hash_combinaison';
import {compatibilityCache} from '@root/lib/plan_production/bobines_refentes_compatibility_cache';
import {
  checkColorsAreCompatbile,
  getColorsRestrictionsForBobine,
} from '@root/lib/plan_production/colors_compatibility';
import {BobineFilleClichePose, Refente} from '@root/lib/plan_production/model';
import {permutations} from '@root/lib/plan_production/utils';

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
  // Filter the selectable bobines filles to make sure we only keep the ones that have at least
  // one valid place on the refente
  const compatibleSelectableBobines = selectableBobines.filter(
    b => applyBobinesOnRefente([b], refente) !== RefenteStatus.INCOMPATIBLE
  );

  // Optimization #3
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

  // TODO - Optimization #4
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
  let currentPoseCount = 0;
  for (const refenteLaize of refente.laizes) {
    if (refenteLaize !== laize) {
      currentPoseCount = 0;
      continue;
    }
    currentPoseCount++;
    if (currentPoseCount === pose) {
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
    if (!laizesLeft.has(laize)) {
      return undefined;
    }
    const left = laizesLeft.get(laize) || 0;
    const newLeft = left - pose;
    if (newLeft < 0) {
      return undefined;
    }
    if (newLeft === 0) {
      laizesLeft.delete(laize);
    } else {
      laizesLeft.set(laize, left - pose);
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
    b => laizesLeft.get(b.laize) || 0 >= b.pose
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
    if (status === RefenteStatus.COMPATIBLE_WITH_SPACE_LEFT_AND_ON_NEXT_POSITION) {
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
    } else {
      // Only test with the selectable bobine before and after the selected ones since the selected bobines are not compatible
      // on the next index.
      const newSelectedWithSelectableAfter = selectedBobines.concat([selectableBobine]);
      const resForAfter = compatibilityExistsForOrderedBobines(
        newSelectedWithSelectableAfter,
        newSelectable,
        refente
      );
      if (resForAfter !== undefined) {
        return resForAfter;
      }
      const newSelectedWithSelectableBefore = [selectableBobine].concat(selectedBobines);
      const resForBefore = compatibilityExistsForOrderedBobines(
        newSelectedWithSelectableBefore,
        newSelectable,
        refente
      );
      if (resForBefore !== undefined) {
        return resForBefore;
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
    b.map(bb => `${bb.laize}_${bb.pose}`).join('-')
  );
}

export enum RefenteStatus {
  INCOMPATIBLE,
  COMPATIBLE_WITH_SPACE_LEFT,
  COMPATIBLE_WITH_SPACE_LEFT_AND_ON_NEXT_POSITION,
  COMPATIBLE,
}

export function applyBobinesOnRefenteFromIndex(
  bobines: BobineFilleClichePose[],
  refente: Refente,
  startIndex: number
): RefenteStatus {
  let indexInRefente = startIndex;
  for (const bobine of bobines) {
    for (let i = 0; i < bobine.pose; i++) {
      const currentRefenteLaize = refente.laizes[indexInRefente];
      if (currentRefenteLaize !== bobine.laize) {
        return RefenteStatus.INCOMPATIBLE;
      }
      indexInRefente++;
    }
  }
  if (indexInRefente === refente.laizes.length && startIndex === 0) {
    return RefenteStatus.COMPATIBLE;
  }
  return RefenteStatus.COMPATIBLE_WITH_SPACE_LEFT;
}

export function applyBobinesOnRefente(
  bobines: BobineFilleClichePose[],
  refente: Refente
): RefenteStatus {
  const bobinesLaizesSum = sum(bobines.map(b => b.pose));
  for (let i = 0; i <= refente.laizes.length - bobinesLaizesSum; i++) {
    const res = applyBobinesOnRefenteFromIndex(bobines, refente, i);
    if (res === RefenteStatus.COMPATIBLE) {
      return res;
    }
    if (res === RefenteStatus.COMPATIBLE_WITH_SPACE_LEFT) {
      // Check if the bobines can be applied on the next position
      const resNextSpot = applyBobinesOnRefenteFromIndex(bobines, refente, i + 1);
      if (resNextSpot !== RefenteStatus.INCOMPATIBLE) {
        return RefenteStatus.COMPATIBLE_WITH_SPACE_LEFT_AND_ON_NEXT_POSITION;
      } else {
        return RefenteStatus.COMPATIBLE_WITH_SPACE_LEFT;
      }
    }
  }
  return RefenteStatus.INCOMPATIBLE;
}
