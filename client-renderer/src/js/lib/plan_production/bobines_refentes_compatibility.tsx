import {
  checkColorsAreCompatbile,
  getColorsRestrictionsForBobine,
} from 'C:\Users\Matthis\git\dune\client-renderer\src\js\lib\plan_production\colors_compatibility';
import {uniqBy, without, sum} from 'lodash-es';

import {BobineFilleClichePose, Refente} from '@root/lib/plan_production/model';
import {permutations} from '@root/lib/plan_production/utils';

const MAX_COULEURS_IMPRESSIONS = 3;

// This function checks if there is at aleast one combinaison of `BobineFilleClichePose`
// in `selectableBobines` that fits in `refente` given a list of already selected `BobineFilleClichePose`
// provided in `selectedBobines`.
// Returns `undefined` if no combinaison exists. Otherwise returns the first combinaison found.
// TODO - When generating a combinaison, we should check if the color combinaison is also possible
const debug = false;
export function compatibilityExists(
  selectedBobines: BobineFilleClichePose[],
  selectableBobines: BobineFilleClichePose[],
  refente: Refente
): BobineFilleClichePose[] | undefined {
  // Optimization #1
  // Ensure that each selected bobines filles can be placed somewhere on the refente, otherwise we
  // can already return undefined
  const incompatibleSelectedBobines = selectedBobines.filter(
    b => applyBobinesOnRefente([b], refente) === RefenteStatus.INCOMPATIBLE
  );
  if (incompatibleSelectedBobines.length > 0) {
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

  const selectedBobinesCombinaison = getSelectedBobinesCombinaison(selectedBobines);
  for (const combi of selectedBobinesCombinaison) {
    const res = compatibilityExistsForOrderedBobines(combi, compatibleSelectableBobines, refente);
    if (res !== undefined) {
      return res;
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
function analyseLaizesLeftOnRefente(
  selectedBobines: BobineFilleClichePose[],
  refente: Refente
): {[key: number]: number} | undefined {
  const res: {[key: number]: number} = {};
  for (const laize of refente.laizes) {
    if (!res[laize]) {
      res[laize] = 0;
    }
    res[laize]++;
  }
  for (const bobine of selectedBobines) {
    const {laize, pose} = bobine;
    if (!res[laize]) {
      return undefined;
    }
    res[laize] -= pose;
    if (res[laize] < 0) {
      return undefined;
    }
    if (res[laize] === 0) {
      delete res[laize];
    }
  }
  return res;
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
    b => (laizesLeft[b.laize] || 0) >= b.pose
  );

  // First we check if the selected bobines can be applied on the refente
  const status = applyBobinesOnRefente(selectedBobines, refente);
  if (status === RefenteStatus.COMPATIBLE) {
    // If everything is good, verify the colors are compatbile
    bobinesColorsAreCompatbile(selectedBobines) ? selectedBobines : undefined;
  }
  if (status === RefenteStatus.INCOMPATIBLE) {
    return undefined;
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
