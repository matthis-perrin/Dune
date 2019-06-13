import {permutations} from '@shared/lib/utils';

export interface ColorRestriction {
  couleurs: string[];
  importanceOrdre: boolean;
}

function isEqual<T>(arr1: T[], arr2: T[]): boolean {
  if (arr1.length !== arr2.length) {
    return false;
  }
  for (let i = 0; i < arr1.length; i++) {
    const v1 = arr1[i];
    const v2 = arr2[i];
    if (Array.isArray(v1) && Array.isArray(v2)) {
      if (!isEqual(v1, v2)) {
        return false;
      }
    } else {
      if (v1 !== v2) {
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

function mergeTwoOverlappingSequence<T>(sequence1: T[], sequence2: T[]): T[] {
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
    if (isEqual(seq1Segment, seq2Segment)) {
      const seq1LeftSide = safeSlice(sequence1, 0, seq1Start);
      const seq1RightSide = safeSlice(sequence1, seq1End, l1);
      const seq2LeftSide = safeSlice(sequence2, 0, seq2Start);
      const seq2RightSide = safeSlice(sequence2, seq2End, l2);
      const overlap = seq1LeftSide
        .concat(seq2LeftSide)
        .concat(seq1Segment)
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

function mergeOverlappingSequences<T>(sequences: T[][]): T[] {
  let merged: T[] = [];
  sequences.forEach(seq => {
    const newMerged = mergeTwoOverlappingSequence(merged, seq);
    merged = newMerged;
  });
  return sequences.reduce(mergeTwoOverlappingSequence, []);
}

function allSmallestMergedOrderedColorsSequences(colors: string[][]): string[][] {
  const allPermutations = permutations(colors);
  if (allPermutations.length === 0) {
    return [];
  }
  const mergedOrderedColorsSequences: string[][] = [];
  allPermutations.forEach(p => mergedOrderedColorsSequences.push(mergeOverlappingSequences(p)));
  let smallest = mergedOrderedColorsSequences[0];
  mergedOrderedColorsSequences.forEach(colorSequence => {
    if (colorSequence.length < smallest.length) {
      smallest = colorSequence;
    }
  });
  const allSmallest = mergedOrderedColorsSequences.filter(
    colorSequence => colorSequence.length === smallest.length
  );
  const dedupingMap = new Map<string, string[]>();
  allSmallest.forEach(seq => dedupingMap.set(seq.join(','), seq));
  return Array.from(dedupingMap.values());
}

export function generateAcceptableColorsOrder(restrictions: ColorRestriction[]): string[] {
  const orderImportantColorsSequences = restrictions
    .filter(r => r.importanceOrdre)
    .map(r => r.couleurs);
  const orderNotImportantColorsSequences = restrictions
    .filter(r => !r.importanceOrdre)
    .map(r => r.couleurs);

  const allSmallest = allSmallestMergedOrderedColorsSequences(orderImportantColorsSequences);
  const mergedOrderedColors = [...(allSmallest.length > 0 ? allSmallest[0] : [])];
  orderNotImportantColorsSequences.forEach(colors => {
    colors.forEach(c => {
      if (mergedOrderedColors.indexOf(c) === -1) {
        mergedOrderedColors.push(c);
      }
    });
  });

  return mergedOrderedColors;
}

function dedup(colors: string[][]): string[][] {
  const dedupMap = new Map<string, string[]>();
  colors.forEach(arr => dedupMap.set(arr.join(','), arr));
  return Array.from(dedupMap.values());
}

export function generateAllAcceptableColorsOrder(
  restrictions: ColorRestriction[],
  maxColors: number
): string[][] {
  const orderImportantColorsSequences = restrictions
    .filter(r => r.importanceOrdre)
    .map(r => r.couleurs);
  const orderNotImportantColorsSequences = restrictions
    .filter(r => !r.importanceOrdre)
    .map(r => r.couleurs);
  const notImportantColorsMap = new Map<string, void>();
  orderNotImportantColorsSequences.forEach(seq => seq.forEach(c => notImportantColorsMap.set(c)));
  const uniqNotImportantColors = Array.from(notImportantColorsMap.keys());

  const mergedOrderedColors = [
    ...allSmallestMergedOrderedColorsSequences(orderImportantColorsSequences),
  ];

  const orderedColorsSize = mergedOrderedColors.length === 0 ? 0 : mergedOrderedColors[0].length;
  const notOrderedColorsSize = uniqNotImportantColors.length;
  for (let i = 0; i < maxColors - orderedColorsSize - notOrderedColorsSize; i++) {
    uniqNotImportantColors.push('');
  }

  if (mergedOrderedColors.length === 0) {
    return dedup(permutations(uniqNotImportantColors));
  }

  if (uniqNotImportantColors.length === 0) {
    return mergedOrderedColors;
  }

  const orderNotImportantColorsSequencesNotInResult: string[] = [];
  uniqNotImportantColors.forEach(c => {
    if (
      mergedOrderedColors[0].indexOf(c) === -1 &&
      orderNotImportantColorsSequencesNotInResult.indexOf(c) === -1
    ) {
      orderNotImportantColorsSequencesNotInResult.push(c);
    }
  });

  let finalPermutations: string[][] = [];
  mergedOrderedColors.forEach(orderedColors => {
    const perms = permutations(
      orderNotImportantColorsSequencesNotInResult.map(c => [c]).concat([orderedColors])
    );
    const flattened = perms.map(p => p.reduce((acc, curr) => acc.concat(curr), []));
    finalPermutations = finalPermutations.concat(flattened);
  });

  return dedup(finalPermutations);
}
