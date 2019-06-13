import {BobineFilleClichePose} from '@root/plan_production/models';

import {
  getBobineFillePoses,
  getBobineFilleImportanceOrdreCouleurs,
  getBobineFilleCouleursImpression,
} from '@shared/lib/bobines_filles';
import {BobineFille, Cliche} from '@shared/models';

export function getBobineHash(
  laize: number,
  pose: number,
  importanceOrdreCouleurs: boolean,
  couleursImpression: string[]
): string {
  return `${laize}_${pose}_${
    importanceOrdreCouleurs ? couleursImpression.join(',') : couleursImpression.sort().join(',')
  }_${importanceOrdreCouleurs && couleursImpression.length > 1 ? 'Y' : 'N'}`;
}

export function getBobineFilleClichePose(
  bobine: BobineFille,
  allCliches: Map<string, Cliche>
): BobineFilleClichePose[] {
  if (isValidBobineFille(bobine)) {
    const {ref, laize = 0, couleurPapier = '', grammage = 0} = bobine;
    const poses = getBobineFillePoses(bobine, allCliches);
    const couleursImpression = getBobineFilleCouleursImpression(bobine, allCliches);
    const importanceOrdreCouleurs = getBobineFilleImportanceOrdreCouleurs(bobine, allCliches);
    return poses.map(pose => {
      const hash = getBobineHash(laize, pose, importanceOrdreCouleurs, couleursImpression);
      const transformedCouleurPapier = couleurPapier === 'ECRU ENDUIT' ? 'ECRU' : couleurPapier;
      return {
        ref,
        laize,
        grammage,
        couleurPapier: transformedCouleurPapier,
        hash,
        pose,
        couleursImpression,
        importanceOrdreCouleurs,
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
