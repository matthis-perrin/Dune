import {ClichePose} from '@root/plan_production/models';
import {Cliche} from '@shared/models';
import {getPoses, getCouleurs} from '@shared/lib/cliches';

export function getClichePoses(cliche?: Cliche): ClichePose[] {
  if (cliche && cliche.sommeil) {
    return [];
  }
  const importanceOrdreCouleurs = cliche ? cliche.importanceOrdreCouleurs : false;
  const couleursImpression = getCouleurs(cliche);
  return getPoses(cliche).map(pose => ({
    refCliche: cliche && cliche.ref,
    pose,
    couleursImpression,
    importanceOrdreCouleurs,
  }));
}
