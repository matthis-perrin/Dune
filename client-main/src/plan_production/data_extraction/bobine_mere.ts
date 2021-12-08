import {BobineMerePapier, BobineMerePolypro} from '@root/plan_production/models';
import {BobineMere} from '@shared/models';

const POLYPRO_COULEUR = 'POLYPRO';

export function getBobinesMeresPapier(bobinesMeres: BobineMere[]): BobineMerePapier[] {
  const bobineMerePapier: BobineMerePapier[] = [];
  bobinesMeres.forEach(bobineMere => {
    if (isValidPapier(bobineMere)) {
      const {ref, laize = 0, couleurPapier = '', grammage = 0} = bobineMere;
      bobineMerePapier.push({ref, laize, couleurPapier, grammage});
    }
  });
  return bobineMerePapier;
}

export function getBobinesMeresPolypro(bobinesMeres: BobineMere[]): BobineMerePolypro[] {
  const bobineMerePlypro: BobineMerePolypro[] = [];
  bobinesMeres.forEach(bobineMere => {
    if (isValidPolypro(bobineMere)) {
      const {ref, laize = 0} = bobineMere;
      bobineMerePlypro.push({ref, laize});
    }
  });
  return bobineMerePlypro;
}

export function isValidPolypro(bobineMere: BobineMere): boolean {
  const {sommeil, laize, couleurPapier} = bobineMere;
  return !sommeil && laize !== undefined && laize > 0 && couleurPapier === POLYPRO_COULEUR;
}

export function isValidPapier(bobineMere: BobineMere): boolean {
  const {sommeil, laize, couleurPapier, grammage} = bobineMere;
  return (
    !sommeil &&
    laize !== undefined &&
    laize > 0 &&
    grammage !== undefined &&
    grammage > 0 &&
    couleurPapier !== undefined &&
    couleurPapier !== '' &&
    couleurPapier !== POLYPRO_COULEUR
  );
}
