import {Refente as RefenteAlgo} from '@root/plan_production/models';

import {getRefenteLaizes, getRefenteSize} from '@shared/lib/refentes';
import {Refente as RefenteModel} from '@shared/models';

export function getRefentes(refentes: RefenteModel[]): RefenteAlgo[] {
  const refentesAlgo: RefenteAlgo[] = [];
  refentes.forEach(r => {
    if (isValidRefente(r)) {
      const {ref, refPerfo} = r;
      const laize = getRefenteSize(r);
      refentesAlgo.push({
        ref,
        refPerfo,
        laizes: getRefenteLaizes(r).map(l => Math.round(l)),
        laize,
      });
    }
  });
  return refentesAlgo;
}

export function isValidRefente(refente: RefenteModel): boolean {
  return !refente.sommeil;
}
