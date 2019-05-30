import {isEqual, minBy} from 'lodash-es';

import {BobineFilleClichePose} from '@root/lib/plan_production/model';
import {permutations} from '@root/lib/plan_production/utils';

export interface ColorRestriction {
  couleurs: string[];
  importanceOrdre: boolean;
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

function smallestMergedOrderedColorsSequences(colors: string[][]): string[] {
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
  return smallest;
}

function generateAcceptableColorsOrder(restrictions: ColorRestriction[]): string[] {
  const orderImportantColorsSequences = restrictions
    .filter(r => r.importanceOrdre)
    .map(r => r.couleurs);
  const orderNotImportantColorsSequences = restrictions
    .filter(r => !r.importanceOrdre)
    .map(r => r.couleurs);

  const mergedOrderedColors = [
    ...smallestMergedOrderedColorsSequences(orderImportantColorsSequences),
  ];
  orderNotImportantColorsSequences.forEach(colors => {
    colors.forEach(c => {
      if (mergedOrderedColors.indexOf(c) === -1) {
        mergedOrderedColors.push(c);
      }
    });
  });

  return mergedOrderedColors;
}

export function checkColorsAreCompatbile(
  restrictions: ColorRestriction[],
  maxColors: number
): boolean {
  const acceptableColorsOrder = generateAcceptableColorsOrder(restrictions);
  return acceptableColorsOrder.length <= maxColors;
}

export function getColorsRestrictionsForBobine(bobine: BobineFilleClichePose): ColorRestriction {
  return {
    couleurs: [...bobine.couleursImpression],
    importanceOrdre: bobine.importanceOrdreCouleurs,
  };
}
