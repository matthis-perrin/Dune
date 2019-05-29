export interface ClichePose {
  refCliche?: string;
  pose: number;
  couleursImpression: string[];
  importanceOrdreCouleurs: boolean;
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
