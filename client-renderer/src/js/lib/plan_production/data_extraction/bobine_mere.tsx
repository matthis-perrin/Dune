import {BobineMerePapier, BobineMerePolypro} from '@root/lib/plan_production/model';
import {BobineMere} from '@shared/models';

const POLYPRO_COULEUR = 'POLYPRO';

export function getBobinesMeresPapier(bobinesMeres: BobineMere[]): BobineMerePapier[] {
  const bobineMerePapier: BobineMerePapier[] = [];
  bobinesMeres.forEach(bobineMere => {
    const {ref, sommeil, laize, couleurPapier, grammage} = bobineMere;
    if (
      !sommeil &&
      laize !== undefined &&
      laize > 0 &&
      grammage !== undefined &&
      grammage > 0 &&
      couleurPapier !== undefined &&
      couleurPapier !== '' &&
      couleurPapier !== POLYPRO_COULEUR
    ) {
      bobineMerePapier.push({ref, laize, couleurPapier, grammage});
    }
  });
  return bobineMerePapier;
}

export function getBobinesMeresPolypro(bobinesMeres: BobineMere[]): BobineMerePolypro[] {
  const bobineMerePlypro: BobineMerePolypro[] = [];
  bobinesMeres.forEach(bobineMere => {
    const {ref, sommeil, laize, couleurPapier} = bobineMere;
    if (!sommeil && laize !== undefined && laize > 0 && couleurPapier === POLYPRO_COULEUR) {
      bobineMerePlypro.push({ref, laize});
    }
  });
  return bobineMerePlypro;
}
