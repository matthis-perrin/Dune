import {BobineFilleClichePose} from '@root/plan_production/models';

import {getCouleursForCliches, getPosesForCliches} from '@shared/lib/cliches';
import {BobineColors} from '@shared/lib/encrier';
import {BobineFille, Cliche} from '@shared/models';

export function getBobineHash(
  laize: number,
  pose: number,
  couleursImpression: BobineColors
): string {
  const orderedHash = couleursImpression.ordered.map(c => c.color).join(',');
  const nonOrderedHash = couleursImpression.nonOrdered.map(c => c.color).join(',');
  return `${laize}_${pose}_O:${orderedHash}_N:${nonOrderedHash}`;
}

export function getBobineFilleClichePose(
  bobine: BobineFille,
  allCliches: Map<string, Cliche>
): BobineFilleClichePose[] {
  if (isValidBobineFille(bobine)) {
    const {ref, laize = 0, couleurPapier = '', grammage = 0} = bobine;
    const cliche1 = bobine.refCliche1 === undefined ? undefined : allCliches.get(bobine.refCliche1);
    const cliche2 = bobine.refCliche2 === undefined ? undefined : allCliches.get(bobine.refCliche2);
    const refsCliches: string[] = [];
    if (bobine.refCliche1) {
      refsCliches.push(bobine.refCliche1);
    }
    if (bobine.refCliche2) {
      refsCliches.push(bobine.refCliche2);
    }
    const poses = getPosesForCliches(cliche1, cliche2);
    const couleursImpression = getCouleursForCliches(cliche1, cliche2);
    return poses.map(pose => {
      const hash = getBobineHash(laize, pose, couleursImpression);
      const transformedCouleurPapier = couleurPapier === 'ECRU ENDUIT' ? 'ECRU' : couleurPapier;
      return {
        ref,
        laize,
        grammage,
        couleurPapier: transformedCouleurPapier,
        hash,
        pose,
        couleursImpression,
        refsCliches,
      };
    });
  }
  return [];
}

export function isValidBobineFille(bobineFille: BobineFille): boolean {
  const {sommeil, laize, couleurPapier, grammage} = bobineFille;
  return (
    !sommeil &&
    laize !== undefined &&
    laize > 0 &&
    grammage !== undefined &&
    grammage > 0 &&
    couleurPapier !== undefined &&
    couleurPapier !== ''
  );
}
