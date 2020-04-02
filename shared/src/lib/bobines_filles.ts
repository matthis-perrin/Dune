import {BobineFille, Cliche, POSE_NEUTRE} from '@shared/models';

export function getBobineFilleImportanceOrdreCouleurs(
  bobine: BobineFille,
  allCliches: Map<string, Cliche>
): boolean {
  const {refCliche1, refCliche2} = bobine;
  if (refCliche1) {
    const cliche1 = allCliches.get(refCliche1);
    if (cliche1) {
      return cliche1.importanceOrdreCouleurs;
    }
  }
  if (refCliche2) {
    const cliche2 = allCliches.get(refCliche2);
    if (cliche2) {
      return cliche2.importanceOrdreCouleurs;
    }
  }
  return false;
}

export function dedupePoseNeutre(poses: number[]): number[] {
  const hasNeutre = poses.indexOf(POSE_NEUTRE) !== -1;
  const filteredPoses = poses.filter((p) => p !== POSE_NEUTRE);
  if (hasNeutre) {
    filteredPoses.unshift(POSE_NEUTRE);
  }
  return filteredPoses;
}
