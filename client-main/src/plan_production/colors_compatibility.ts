import {BobineFilleClichePose} from '@root/plan_production/models';
import {ColorRestriction, generateAcceptableColorsOrder} from '@shared/lib/encrier';

export function checkColorsAreCompatbile(
  restrictions: ColorRestriction[],
  maxColors: number
): boolean {
  const acceptableColorsOrder = generateAcceptableColorsOrder(restrictions);
  return acceptableColorsOrder.length <= maxColors;
}

export function getColorsRestrictionsForBobine(bobine: BobineFilleClichePose): ColorRestriction {
  return {
    couleurs: [...bobine.couleursImpression],
    importanceOrdre: bobine.importanceOrdreCouleurs,
  };
}
