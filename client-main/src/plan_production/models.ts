import {Refente as RefenteAlgo} from '@root/plan_production/models';

import {BobineColors} from '@shared/lib/encrier';
import {Perfo} from '@shared/models';

export interface PlanProduction {
  polypro?: BobineMerePolypro;
  papier?: BobineMerePapier;
  perfo?: Perfo;
  refente?: RefenteAlgo;
  bobinesFilles: BobineFilleClichePose[];
}

export interface Selectables {
  selectablePolypros: BobineMerePolypro[];
  selectablePapiers: BobineMerePapier[];
  selectablePerfos: Perfo[];
  selectableRefentes: RefenteAlgo[];
  selectableBobinesFilles: BobineFilleClichePose[];
}

export interface ClichePose {
  pose: number;
  couleursImpression: BobineColors;
}

export interface BobineFilleClichePose extends ClichePose {
  ref: string;
  laize: number;
  couleurPapier: string;
  grammage: number;
  hash: string;
}

export interface BobineMerePapier {
  ref: string;
  laize: number;
  grammage: number;
  couleurPapier: string;
}

export interface BobineMerePolypro {
  ref: string;
  laize: number;
}

export interface Refente {
  ref: string;
  refPerfo: string;
  laizes: number[];
  laize: number;
}
