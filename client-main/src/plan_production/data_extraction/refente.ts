import {Refente as RefenteAlgo} from '@root/plan_production/models';

import {getRefenteLaizes, getRefenteSize} from '@shared/lib/refentes';
import {Refente as RefenteModel} from '@shared/models';

export function getRefentes(refentes: RefenteModel[]): RefenteAlgo[] {
  const refentesAlgo: RefenteAlgo[] = [];
  refentes.forEach(r => {
    if (isValidRefente(r)) {
      refentesAlgo.push(getRefenteAlgo(r));
    }
  });
  return refentesAlgo;
}

export function getRefenteAlgo(refente: RefenteModel): RefenteAlgo {
  const {ref, refPerfo} = refente;
  const laize = getRefenteSize(refente);
  return {
    ref,
    refPerfo,
    laizes: getRefenteLaizes(refente).map(l => Math.round(l)),
    laize,
  };
}

export function isValidRefente(refente: RefenteModel): boolean {
  return !refente.sommeil;
}
