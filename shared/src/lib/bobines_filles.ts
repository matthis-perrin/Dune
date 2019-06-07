import {getPoses, getCouleurs} from '@shared/lib/cliches';
import {BobineFille, Cliche} from '@shared/models';

export function getBobineFillePoses(
  bobine: BobineFille,
  allCliches: Map<string, Cliche>
): number[] {
  const {refCliche1, refCliche2} = bobine;
  let poses: number[] = [];
  if (refCliche1) {
    const cliche1 = allCliches.get(refCliche1);
    if (cliche1) {
      poses = poses.concat(getPoses(cliche1));
    }
  }
  if (refCliche2) {
    const cliche2 = allCliches.get(refCliche2);
    if (cliche2) {
      poses = poses.concat(getPoses(cliche2));
    }
  }
  if (!refCliche1 && !refCliche2) {
    poses = poses.concat(getPoses());
  }
  return poses;
}

export function getBobineFilleCouleursImpression(
  bobine: BobineFille,
  allCliches: Map<string, Cliche>
): string[] {
  const {refCliche1, refCliche2} = bobine;
  if (refCliche1) {
    const cliche1 = allCliches.get(refCliche1);
    if (cliche1) {
      return getCouleurs(cliche1);
    }
  }
  if (refCliche2) {
    const cliche2 = allCliches.get(refCliche2);
    if (cliche2) {
      return getCouleurs(cliche2);
    }
  }
  return [];
}

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
