import {permutations} from '@shared/lib/utils';

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

function mapColorsToClicheColor(
  colors: string[],
  clicheColors: ClicheColor[]
): (ClicheColor | undefined)[] {
  let indexInClicheColors = 0;
  return colors.map(c => {
    const clicheColor = clicheColors[indexInClicheColors];
    if (c === clicheColor?.color) {
      indexInClicheColors++;
      return clicheColor;
    }
    return undefined;
  });
}

function getFirstColors(all: ClicheColor[][]): string[] {
  const res = new Set<string>();
  for (const colors of all) {
    if (colors.length > 0) {
      res.add(colors[0].color);
    }
  }
  return Array.from(res.values());
}

function findCombinaisonsForOrderedColors(all: ClicheColor[][]): string[][] {
  const firstColors = getFirstColors(all);
  if (firstColors.length === 0) {
    return [];
  }
  const res: string[][] = [];

  for (const color of firstColors) {
    const newOrderedColors = all.map(colors =>
      colors[0]?.color === color ? colors.slice(1) : colors
    );
    const combinaisons = findCombinaisonsForOrderedColors(newOrderedColors);
    if (combinaisons.length === 0) {
      res.push([color]);
    } else {
      for (const combi of combinaisons) {
        res.push([color, ...combi]);
      }
    }
  }

  return res;
}

function allSmallestArrangementsFromOrderedColors(
  colors: ClicheColor[][],
  maxColors?: number
): EncrierColor[][] {
  const combinaisons = findCombinaisonsForOrderedColors(colors);
  if (combinaisons.length === 0) {
    return [];
  }
  const minSize = combinaisons.reduce<number | undefined>(
    (size, combi) => (size === undefined ? combi.length : Math.min(size, combi.length)),
    undefined
  );
  if (minSize === undefined || (maxColors && minSize > maxColors)) {
    return [];
  }

  const minCombinaisons = combinaisons.filter(c => c.length === minSize);
  console.log(minCombinaisons);

  const allEncrierColors: EncrierColor[][] = [];
  for (const combi of minCombinaisons) {
    const encrierColors: EncrierColor[] = combi.map(c => ({color: c, refsCliche: []}));
    for (const clicheColors of colors) {
      mapColorsToClicheColor(combi, clicheColors).forEach((c, index) => {
        if (c && encrierColors[index].refsCliche.indexOf(c.refCliche) === -1) {
          encrierColors[index].refsCliche.push(c.refCliche);
        }
      });
    }
    allEncrierColors.push(encrierColors);
  }

  return allEncrierColors;
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
  const ordered: EncrierColor[][] = [];

  for (const [color, refsCliche] of nonOrderedClicheColorsMap.entries()) {
    const index = orderedArrangements.map(a => a.color).indexOf(color);
    if (index !== -1) {
      const newOrdered = [...orderedArrangements];
      newOrdered[index].refsCliche = newOrdered[index].refsCliche.concat(refsCliche);
      ordered.push(newOrdered);
    } else {
      const value = nonOrdered.get(color) || [];
      nonOrdered.set(color, value.concat(refsCliche));
    }
  }

  if (ordered.length === 0) {
    return {nonOrdered, ordered: [orderedArrangements]};
  }
  return {nonOrdered, ordered};
}

function clicheColorsToColorMap(clicheColors: ClicheColor[][]): Map<string, string[]> {
  const colorMap = new Map<string, string[]>();
  clicheColors.forEach(seq =>
    seq.forEach(c => {
      const refsCliche = colorMap.get(c.color);
      if (!refsCliche) {
        colorMap.set(c.color, [c.refCliche]);
      } else {
        refsCliche.push(c.refCliche);
      }
    })
  );
  return colorMap;
}

export function validColorCombinaison(bobineColors: BobineColors[], maxColors: number): boolean {
  const nonOrdered = clicheColorsToColorMap(bobineColors.map(c => c.nonOrdered));
  const nonOrderedCount = Array.from(nonOrdered.keys()).length;

  const ordered: ClicheColor[][] = [];
  bobineColors.forEach(bc => {
    if (bc.ordered.length > 0) {
      ordered.push(bc.ordered);
    }
  });

  if (ordered.length === 0) {
    return nonOrderedCount <= maxColors;
  }

  const orderedArrangements = allSmallestArrangementsFromOrderedColors(
    ordered,
    maxColors - nonOrderedCount
  );
  if (orderedArrangements.length === 0) {
    if (ordered.length > 0) {
      return false;
    }
    return nonOrderedCount <= maxColors;
  }

  const arrangementColors = orderedArrangements[0].map(encrier => encrier.color);
  let nonOrderedNotInArrangementCount = 0;
  Array.from(nonOrdered.keys()).forEach(c => {
    if (arrangementColors.indexOf(c) === -1) {
      nonOrderedNotInArrangementCount++;
    }
  });

  return orderedArrangements[0].length + nonOrderedNotInArrangementCount <= maxColors;
}

function indexFirstEmptyEncrier(encrierColors: EncrierColor[]): number {
  for (let i = 0; i < encrierColors.length; i++) {
    if (encrierColors[i].color === '') {
      return i;
    }
  }
  return encrierColors.length;
}

function colorDifferencesCount(encrier1: EncrierColor[], encrier2: EncrierColor[]): number {
  let differenceCount = 0;
  encrier1.forEach((c1, i) => {
    const c2 = encrier2[i];
    if (c1.color !== (c2 && c2.color)) {
      differenceCount++;
    }
  });
  return differenceCount;
}

function getCombiWithOrderedAndNonOrdered(
  ordered: EncrierColor[][],
  nonOrdered: EncrierColor[]
): EncrierColor[][] {
  if (nonOrdered.length === 0) {
    return ordered;
  }
  if (ordered.length === 0) {
    return permutations(nonOrdered);
  }
  const combi: EncrierColor[][] = [];
  ordered.forEach(arrangement => {
    for (let i = 0; i <= arrangement.length; i++) {
      const newArrangement = [...arrangement];
      newArrangement.splice(i, 0, nonOrdered[0]);
      combi.push(newArrangement);
    }
  });
  return getCombiWithOrderedAndNonOrdered(combi, nonOrdered.slice(1));
}

export function generateAllAcceptableColorsOrder(
  bobineColors: BobineColors[],
  maxColors: number,
  previousPlanColors?: EncrierColor[]
): EncrierColor[][] {
  const orderedCliches = bobineColors.map(c => c.ordered);
  const ordered = allSmallestArrangementsFromOrderedColors(orderedCliches, maxColors);
  if (orderedCliches.length === 0 && ordered.length > 0) {
    return [];
  }

  const nonOrdered = clicheColorsToColorMap(bobineColors.map(c => c.nonOrdered));

  let finalArrangements: EncrierColor[][] = [];
  for (const arrangement of ordered.length === 0 ? [[]] : ordered) {
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
      finalArrangements = finalArrangements.concat(
        getCombiWithOrderedAndNonOrdered([orderedArrangement], nonOrderedAsArrangements)
      );
    });
  }

  const deduped = dedup(finalArrangements);
  const sorted = deduped.sort((a1, a2) => {
    if (previousPlanColors) {
      const differenceWithPrevious1 = colorDifferencesCount(a1, previousPlanColors);
      const differenceWithPrevious2 = colorDifferencesCount(a2, previousPlanColors);
      if (differenceWithPrevious1 !== differenceWithPrevious2) {
        // Prefer arrangements with the least difference with the previous plan prod encriers
        return differenceWithPrevious1 - differenceWithPrevious2;
      }
    }
    // Prefer arrangements with the first empty encrier as high as possible
    // (i.e. as close as possible to the end of the array).
    const firstEmptyIndex1 = indexFirstEmptyEncrier(a1);
    const firstEmptyIndex2 = indexFirstEmptyEncrier(a2);
    return firstEmptyIndex2 - firstEmptyIndex1;
  });

  return sorted.map(e => e.reverse());
}
