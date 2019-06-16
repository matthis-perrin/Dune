import {BobineColors, ClicheColor} from '@shared/lib/encrier';
import {permutations} from '@shared/lib/utils';
import {Cliche, POSE_NEUTRE} from '@shared/models';

//
// CLICHES POSES
//

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

export function getPosesForCliche(cliche: Cliche): number[] {
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

function removeMatchingPoseCombi(
  targetPose: number,
  sortedAvailablePoses: number[]
): {hit: boolean; newAvailablePoses: number[]} {
  const sum = sortedAvailablePoses.reduce((acc, curr) => acc + curr, 0);
  if (sum < targetPose) {
    return {hit: false, newAvailablePoses: sortedAvailablePoses};
  }
  if (sum === targetPose) {
    return {hit: true, newAvailablePoses: []};
  }
  for (let i = 0; i < sortedAvailablePoses.length; i++) {
    const newTargetPose = targetPose - sortedAvailablePoses[i];
    const newSortedAvailablePoses = sortedAvailablePoses.filter((_, index) => index !== i);
    if (newTargetPose < 0) {
      continue;
    }
    if (newTargetPose === 0) {
      return {hit: true, newAvailablePoses: newSortedAvailablePoses};
    }
    const res = removeMatchingPoseCombi(newTargetPose, newSortedAvailablePoses);
    if (res.hit) {
      return res;
    }
  }
  return {hit: false, newAvailablePoses: sortedAvailablePoses};
}

function getMatchingPosesInCombi(poses: number[], sortedAvailablePoses: number[]): number[] {
  if (poses.length === 0 || sortedAvailablePoses.length === 0) {
    return [];
  }
  const first = poses[0];
  const {hit, newAvailablePoses} = removeMatchingPoseCombi(first, sortedAvailablePoses);
  const res: number[] = [];
  if (hit) {
    res.push(first);
  }
  return res.concat(getMatchingPosesInCombi(poses.slice(1), newAvailablePoses));
}

function posesAsMap(poses: number[]): Map<number, number> {
  const res = new Map<number, number>();
  poses.forEach(pose => res.set(pose, 1 + (res.get(pose) || 0)));
  return res;
}

function getUsablePosesInCombi(poses: number[], availablePoses: number[]): Map<number, number> {
  const res = new Map<number, number>();
  const sortedAvailablePoses = [...availablePoses].sort();
  permutations(poses).forEach(permutation => {
    const matchingPoses = posesAsMap(getMatchingPosesInCombi(permutation, sortedAvailablePoses));
    Array.from(matchingPoses.entries()).forEach(([pose, count]) =>
      res.set(pose, Math.max(count, res.get(pose) || 0))
    );
  });
  return res;
}

function getAvailablePoses(poses1: number[], poses2: number[]): number[] {
  const res1 = getUsablePosesInCombi(poses1, poses2);
  const res2 = getUsablePosesInCombi(poses2, poses1);
  Array.from(res2.entries()).forEach(([pose, count]) =>
    res1.set(pose, Math.max(count, res1.get(pose) || 0))
  );
  const res: number[] = [];
  Array.from(res1.entries()).forEach(([pose, count]) => {
    for (let i = 0; i < count; i++) {
      res.push(pose);
    }
  });
  return res;
}

export function getPosesForCliches(cliche1?: Cliche, cliche2?: Cliche): number[] {
  if (cliche1 === undefined) {
    if (cliche2 === undefined) {
      return POSES_NEUTRES;
    } else {
      return getPosesForCliche(cliche2);
    }
  } else {
    if (cliche2 === undefined) {
      return getPosesForCliche(cliche1);
    } else {
      return getAvailablePoses(getPosesForCliche(cliche1), getPosesForCliche(cliche2));
    }
  }
}

//
// CLICHE COLORS
//

export function getCouleursForCliches(cliche1?: Cliche, cliche2?: Cliche): BobineColors {
  const couleurCliche1 = getCouleursForCliche(cliche1);
  const couleurCliche2 = getCouleursForCliche(cliche2);
  return {
    ordered: couleurCliche1.ordered.concat(couleurCliche2.ordered),
    nonOrdered: couleurCliche1.nonOrdered.concat(couleurCliche2.nonOrdered),
  };
}

export function getCouleursForCliche(cliche?: Cliche): BobineColors {
  if (!cliche) {
    return {
      ordered: [],
      nonOrdered: [],
    };
  }
  const couleurs: ClicheColor[] = [];
  [
    cliche.couleur1,
    cliche.couleur2,
    cliche.couleur3,
    cliche.couleur4,
    cliche.couleur5,
    cliche.couleur6,
  ].forEach(c => {
    if (c !== undefined && c !== '') {
      couleurs.push({color: c, refCliche: cliche.ref});
    }
  });
  return {
    ordered: cliche.importanceOrdreCouleurs ? couleurs : [],
    nonOrdered: cliche.importanceOrdreCouleurs ? [] : couleurs.sort(),
  };
}
