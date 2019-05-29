import {getClichePoses} from '@root/lib/plan_production/data_extraction/cliche';
import {BobineFilleClichePose, ClichePose} from '@root/lib/plan_production/model';

import {BobineFille, Cliche} from '@shared/models';

export function getBobineFilleClichePose(
  bobine: BobineFille,
  allCliches: {[key: string]: Cliche}
): BobineFilleClichePose[] {
  const {ref, sommeil, laize, couleurPapier, grammage, refCliche1, refCliche2} = bobine;
  if (
    !sommeil &&
    laize !== undefined &&
    laize > 0 &&
    grammage !== undefined &&
    grammage > 0 &&
    couleurPapier !== undefined &&
    couleurPapier !== ''
  ) {
    let clichePoses: ClichePose[] = [];
    if (refCliche1) {
      const cliche1 = allCliches[refCliche1];
      if (cliche1) {
        clichePoses = clichePoses.concat(getClichePoses(cliche1));
      }
    }
    if (refCliche2) {
      const cliche2 = allCliches[refCliche2];
      if (cliche2) {
        clichePoses = clichePoses.concat(getClichePoses(cliche2));
      }
    }
    if (!refCliche1 && !refCliche2) {
      clichePoses = clichePoses.concat(getClichePoses());
    }
    return clichePoses.map(clichePose => {
      const hash = `${laize}_${clichePose.pose}_${
        clichePose.importanceOrdreCouleurs
          ? clichePose.couleursImpression.join(',')
          : clichePose.couleursImpression.sort().join(',')
      }_${clichePose.importanceOrdreCouleurs ? 'Y' : 'N'}`;
      return {...clichePose, ref, laize, grammage, couleurPapier, hash};
    });
  }
  return [];
}
