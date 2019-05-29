import {sum} from 'lodash-es';
import {Refente as RefenteAlgo} from '@root/lib/plan_production/model';
import {Refente as RefenteModel} from '@shared/models';

export function getRefentes(refentes: RefenteModel[]): RefenteAlgo[] {
  const refentesAlgo: RefenteAlgo[] = [];
  refentes.forEach(r => {
    const {
      ref,
      refPerfo,
      sommeil,
      laize1 = 0,
      laize2 = 0,
      laize3 = 0,
      laize4 = 0,
      laize5 = 0,
      laize6 = 0,
      laize7 = 0,
      chute = 0,
    } = r;
    if (!sommeil) {
      const laizes = [laize1, laize2, laize3, laize4, laize5, laize6, laize7].filter(l => l > 0);
      const laize = Math.round(sum(laizes) - chute);
      refentesAlgo.push({
        ref,
        refPerfo,
        laizes,
        laize,
      });
    }
  });
  return refentesAlgo;
}
