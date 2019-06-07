import {Refente} from '@shared/models';

export function getRefenteLaizes(refente: Refente): number[] {
  const {
    laize1 = 0,
    laize2 = 0,
    laize3 = 0,
    laize4 = 0,
    laize5 = 0,
    laize6 = 0,
    laize7 = 0,
  } = refente;
  return [laize1, laize2, laize3, laize4, laize5, laize6, laize7].filter(l => l > 0);
}

export function getRefenteSize(refente: Refente): number {
  const {chute = 0} = refente;
  const laizes = getRefenteLaizes(refente);
  const size = Math.round(laizes.reduce((prev, l) => prev + l, 0) + chute);
  return size;
}
