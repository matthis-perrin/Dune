import {Perfo} from '@shared/models';

export function getPerfos(perfos: Perfo[]): Perfo[] {
  return perfos.filter(isValidPerfo);
}

export function isValidPerfo(refente: Perfo): boolean {
  return !refente.sommeil;
}
