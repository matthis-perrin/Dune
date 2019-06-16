import {permutations} from '@shared/lib/utils';

export interface ColorRestriction {
  couleurs: string[];
  importanceOrdre: boolean;
}

export interface ClicheColor {
  color: string;
  refCliche: string;
}

export interface BobineColors {
  ordered: ClicheColor[];
  nonOrdered: ClicheColor[];
}

export interface EncrierColor {
  color: string;
  refsCliche: string[];
}

function isEqual<T>(arr1: T[], arr2: T[], elementsAreEqual: (t1: T, t2: T) => boolean): boolean {
  if (arr1.length !== arr2.length) {
    return false;
  }
  for (let i = 0; i < arr1.length; i++) {
    const v1 = arr1[i];
    const v2 = arr2[i];
    if (Array.isArray(v1) && Array.isArray(v2)) {
      if (!isEqual(v1, v2, elementsAreEqual)) {
        return false;
      }
    } else {
      if (!elementsAreEqual(v1, v2)) {
        return false;
      }
    }
  }
  return true;
}

function minBy<T>(arr: T[], predicate: (v: T) => number): T {
  let min = arr[0];
  let minValue = predicate(min);
  arr.forEach(v => {
    const value = predicate(v);
    if (value < minValue) {
      minValue = value;
      min = v;
    }
  });
  return min;
}

function safeSlice<T>(seq: T[], start: number, end: number): T[] {
  if (start > seq.length || end <= 0) {
    return [];
  }
  const safeStart = Math.max(start, 0);
  const safeEnd = Math.min(end, seq.length);
  return seq.slice(safeStart, safeEnd);
}

function mergeTwoOverlappingSequence<T>(
  sequence1: T[],
  sequence2: T[],
  elementsAreEqual: (t1: T, t2: T) => boolean,
  mergeEqualSequences: (t1: T[], t2: T[]) => T[]
): T[] {
  const l1 = sequence1.length;
  const l2 = sequence2.length;
  if (l1 === 0) {
    return sequence2;
  }
  if (l2 === 0) {
    return sequence1;
  }

  const allOverlaps: T[][] = [];
  for (let i = 0; i < l1 + l2 - 1; i++) {
    const seq1Start = l1 - i - 1;
    const seq1End = seq1Start + l2;
    const seq2Start = i + 1 - l1;
    const seq2End = i + 1;
    const seq1Segment = safeSlice(sequence1, seq1Start, seq1End);
    const seq2Segment = safeSlice(sequence2, seq2Start, seq2End);
    if (isEqual(seq1Segment, seq2Segment, elementsAreEqual)) {
      const seq1LeftSide = safeSlice(sequence1, 0, seq1Start);
      const seq1RightSide = safeSlice(sequence1, seq1End, l1);
      const seq2LeftSide = safeSlice(sequence2, 0, seq2Start);
      const seq2RightSide = safeSlice(sequence2, seq2End, l2);
      const overlap = seq1LeftSide
        .concat(seq2LeftSide)
        .concat(mergeEqualSequences(seq1Segment, seq2Segment))
        .concat(seq1RightSide)
        .concat(seq2RightSide);
      allOverlaps.push(overlap);
    }
  }
  if (allOverlaps.length === 0) {
    return sequence1.concat(sequence2);
  }
  return minBy(allOverlaps, overlap => overlap.length) || sequence1.concat(sequence2);
}

function mergeOverlappingSequences<T>(
  sequences: T[][],
  elementsAreEqual: (t1: T, t2: T) => boolean,
  mergeEqualSequences: (t1: T[], t2: T[]) => T[]
): T[] {
  let merged: T[] = [];
  sequences.forEach(seq => {
    const newMerged = mergeTwoOverlappingSequence(
      merged,
      seq,
      elementsAreEqual,
      mergeEqualSequences
    );
    merged = newMerged;
  });
  return sequences.reduce(
    (acc, curr) => mergeTwoOverlappingSequence(acc, curr, elementsAreEqual, mergeEqualSequences),
    []
  );
}

function allSmallestArrangementsFromOrderedColors(colors: ClicheColor[][]): EncrierColor[][] {
  const allPermutations = permutations(colors);
  if (allPermutations.length === 0) {
    return [];
  }
  const encrierColorsAreEqual = (ec1: EncrierColor, ec2: EncrierColor) => ec1.color === ec2.color;
  const mergeEncrierColorSeq = (ec1Seq: EncrierColor[], ec2Seq: EncrierColor[]) => {
    const mergedSeq: EncrierColor[] = [];
    for (let i = 0; i < ec1Seq.length; i++) {
      mergedSeq.push({
        color: ec1Seq[i].color,
        refsCliche: ec1Seq[i].refsCliche.concat(ec2Seq[i].refsCliche),
      });
    }
    return mergedSeq;
  };
  const mergedOrderedColorsSequences: EncrierColor[][] = [];
  allPermutations.forEach(perm => {
    const arrangements: EncrierColor[][] = perm.map(clichesColors =>
      clichesColors.map(clicheColor => ({
        color: clicheColor.color,
        refsCliche: [clicheColor.refCliche],
      }))
    );
    mergedOrderedColorsSequences.push(
      mergeOverlappingSequences(arrangements, encrierColorsAreEqual, mergeEncrierColorSeq)
    );
  });
  let smallest = mergedOrderedColorsSequences[0];
  mergedOrderedColorsSequences.forEach(colorSequence => {
    if (colorSequence.length < smallest.length) {
      smallest = colorSequence;
    }
  });
  const allSmallest = mergedOrderedColorsSequences.filter(
    colorSequence => colorSequence.length === smallest.length
  );
  const dedupingMap = new Map<string, EncrierColor[]>();
  allSmallest.forEach(seq => dedupingMap.set(seq.map(v => v.color).join(','), seq));
  return Array.from(dedupingMap.values());
}

function hashArrangement(arrangement: EncrierColor[]): string {
  return arrangement
    .map(encrierColor => `${encrierColor.color}-${[...encrierColor.refsCliche].sort().join(',')}`)
    .join('_');
}

function dedup(arrangements: EncrierColor[][]): EncrierColor[][] {
  const dedupMap = new Map<string, EncrierColor[]>();
  arrangements.forEach(arr => dedupMap.set(hashArrangement(arr), arr));
  return Array.from(dedupMap.values());
}

function integrateNonOrderedInOrdered(
  orderedArrangements: EncrierColor[],
  nonOrderedClicheColorsMap: Map<string, string[]>
): {nonOrdered: Map<string, string[]>; ordered: EncrierColor[][]} {
  const nonOrdered = new Map<string, string[]>();
  let ordered: EncrierColor[][] = [];

  for (let [color, refsCliche] of nonOrderedClicheColorsMap.entries()) {
    const index = orderedArrangements.map(a => a.color).indexOf(color);
    if (index !== -1) {
      const newOrdered = [...orderedArrangements];
      newOrdered[index].refsCliche = newOrdered[index].refsCliche.concat(refsCliche);
      ordered.push(newOrdered);
      nonOrderedClicheColorsMap.delete(color);
    }
  }

  if (ordered.length === 0) {
    return {nonOrdered, ordered: [orderedArrangements]};
  }
  return {nonOrdered, ordered};
}

function computeOrderedAndNonOrdered(
  bobineColors: BobineColors[]
): {nonOrdered: Map<string, string[]>; ordered: EncrierColor[][]} {
  const allOrderedClicheColors: ClicheColor[][] = bobineColors.map(c => c.ordered);
  const allNonOrderedClicheColors: ClicheColor[][] = bobineColors.map(c => c.nonOrdered);
  const nonOrderedClicheColorsMap = new Map<string, string[]>();
  allNonOrderedClicheColors.forEach(seq =>
    seq.forEach(c => {
      const refsCliche = nonOrderedClicheColorsMap.get(c.color);
      if (!refsCliche) {
        nonOrderedClicheColorsMap.set(c.color, [c.refCliche]);
      } else {
        refsCliche.push(c.refCliche);
      }
    })
  );

  const arrangementsFromOrdered = [
    ...allSmallestArrangementsFromOrderedColors(allOrderedClicheColors),
  ];

  return {ordered: arrangementsFromOrdered, nonOrdered: nonOrderedClicheColorsMap};
}

export function validColorCombinaison(bobineColors: BobineColors[], maxColors: number): boolean {
  // Possible optimisation here if it turns out to be a bottleneck. We could generate less combinaisons in
  // `computeOrderedAndNonOrdered` by stopping early within the call to `allSmallestArrangementsFromOrderedColors`.
  const {ordered, nonOrdered} = computeOrderedAndNonOrdered(bobineColors);

  const nonOrderedCount = Array.from(nonOrdered.keys()).length;
  if (ordered.length === 0) {
    return nonOrderedCount <= maxColors;
  }

  return ordered[0].length + nonOrderedCount <= maxColors;
}

export function generateAllAcceptableColorsOrder(
  bobineColors: BobineColors[],
  maxColors: number
): EncrierColor[][] {
  const {ordered, nonOrdered} = computeOrderedAndNonOrdered(bobineColors);

  let finalArrangements: EncrierColor[][] = [];
  for (let arrangement of ordered) {
    const res = integrateNonOrderedInOrdered(arrangement, nonOrdered);
    const reminaingNonOrdered = res.nonOrdered;
    const allOrdered = res.ordered;
    const nonOrderedAsArrangements: EncrierColor[] = Array.from(reminaingNonOrdered.entries()).map(
      entry => ({
        color: entry[0],
        refsCliche: entry[1],
      })
    );

    const emptyEncrierCount =
      maxColors -
      (allOrdered.length === 0 ? 0 : allOrdered[0].length) -
      Array.from(reminaingNonOrdered.keys()).length;
    for (let i = 0; i < emptyEncrierCount; i++) {
      nonOrderedAsArrangements.push({color: '', refsCliche: []});
    }

    allOrdered.forEach(orderedArrangement => {
      const perms = permutations(
        nonOrderedAsArrangements.map(c => [c]).concat([orderedArrangement])
      );
      const flattened = perms.map(p => p.reduce((acc, curr) => acc.concat(curr), []));
      finalArrangements = finalArrangements.concat(flattened);
    });
  }

  return dedup(finalArrangements);
}
