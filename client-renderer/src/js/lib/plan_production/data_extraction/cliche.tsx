import {ClichePose} from '@root/lib/plan_production/model';
import {Cliche} from '@shared/models';

const POSES_NEUTRES = [1, 1, 1, 1, 1, 1, 1];

function getPoses(cliche?: Cliche): number[] {
  if (!cliche) {
    return POSES_NEUTRES;
  }
  const poses: number[] = [];
  [cliche.nombrePosesA, cliche.nombrePosesB, cliche.nombrePosesC, cliche.nombrePosesD].forEach(
    p => {
      if (p !== undefined && p > 0) {
        poses.push(p);
      }
    }
  );
  return poses;
}

function getCouleurs(cliche?: Cliche): string[] {
  if (!cliche) {
    return [];
  }
  const couleurs: string[] = [];
  [
    cliche.couleur1,
    cliche.couleur2,
    cliche.couleur3,
    cliche.couleur4,
    cliche.couleur5,
    cliche.couleur6,
  ].forEach(c => {
    if (c !== undefined && c !== '') {
      couleurs.push(c);
    }
  });
  return couleurs;
}

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
