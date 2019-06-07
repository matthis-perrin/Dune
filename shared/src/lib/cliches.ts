import {Cliche, POSE_NEUTRE} from '@shared/models';

const POSES_NEUTRES = [
  POSE_NEUTRE,
  POSE_NEUTRE,
  POSE_NEUTRE,
  POSE_NEUTRE,
  POSE_NEUTRE,
  POSE_NEUTRE,
  POSE_NEUTRE,
];

export function getPoseSize(pose: number): number {
  if (pose === POSE_NEUTRE) {
    return 1;
  }
  return pose;
}

export function getPoses(cliche?: Cliche): number[] {
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

export function getCouleurs(cliche?: Cliche): string[] {
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
