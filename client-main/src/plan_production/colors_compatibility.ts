import {BobineFilleClichePose} from '@root/plan_production/models';
import {ColorRestriction} from '@shared/lib/encrier';

export function getColorsRestrictionsForBobine(bobine: BobineFilleClichePose): ColorRestriction {
  return {
    couleurs: [...bobine.couleursImpression],
    importanceOrdre: bobine.importanceOrdreCouleurs,
  };
}
