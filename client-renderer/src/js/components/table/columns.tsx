import {sum} from 'lodash-es';
import * as React from 'react';

import {Duration} from '@root/components/common/duration';
import {OperationConstraint} from '@root/components/common/operation_constraint';
import {ColumnType} from '@root/components/table/column';
import {BobineFilleClichePose} from '@root/lib/plan_production/model';

import {Stock, Cliche, OperationConstraint as OperationConstraintModel} from '@shared/models';

interface StockIndex {
  [key: string]: Stock[];
}

function getStock<T extends {ref: string}>(data: T, stocks: StockIndex): number {
  const stock = stocks[data.ref] || [];
  return sum(stock.map(s => s.reel + s.reserve - s.commande));
}

function getStocksSortFunction<T extends {ref: string}>(
  stocks: StockIndex
): (d1: T, d2: T) => number {
  return function(data1: T, data2: T): number {
    const s1 = getStock(data1, stocks);
    const s2 = getStock(data2, stocks);
    return s1 - s2;
  };
}

function getPoses(cliche: Cliche): number[] {
  const poses = [
    cliche.nombrePosesA,
    cliche.nombrePosesB,
    cliche.nombrePosesC,
    cliche.nombrePosesD,
  ];
  const definedPoses = poses.filter(p => !!p) as number[];
  return definedPoses.sort().reverse();
}

function sortArrayFunction<T>(
  arr1: T[],
  arr2: T[],
  useLength: boolean,
  compare: (el1: T, el2: T) => number
): number {
  if (useLength && arr1.length !== arr2.length) {
    return arr1.length - arr2.length;
  }
  if (arr1.length === 0 && arr2.length === 0) {
    return 0;
  }
  if (arr1.length === 0 && arr2.length > 0) {
    return -1;
  }
  if (arr1.length > 0 && arr2.length === 0) {
    return 1;
  }
  if (arr1[0] === arr2[0]) {
    return sortArrayFunction(arr1.slice(1), arr2.slice(1), useLength, compare);
  }
  return compare(arr1[0], arr2[0]);
}

function sortClichesPosesFunction(c1: Cliche, c2: Cliche): number {
  return sortArrayFunction(getPoses(c1), getPoses(c2), false, (p1, p2) => p1 - p2);
}

function sortBobineFilleClichePoseCouleursFunction(
  b1: BobineFilleClichePose,
  b2: BobineFilleClichePose
): number {
  return sortArrayFunction(b1.couleursImpression, b2.couleursImpression, true, (el1, el2) =>
    el1.toLowerCase().localeCompare(el2.toLowerCase())
  );
}

// tslint:disable:no-magic-numbers
const REFERENCE_COLUMN = (width: number) => ({
  name: 'ref',
  title: 'Reference',
  type: ColumnType.String,
  width,
  canFilter: false,
});

const ID_COLUMN = (width: number) => ({
  name: 'id',
  title: 'Id',
  type: ColumnType.Number,
  width,
  canFilter: false,
});

const DESIGNATION_COLUMN = {
  name: 'designation',
  title: 'Designation',
  type: ColumnType.String,
  canFilter: false,
};

const DESCRIPTION_COLUMN = {
  name: 'description',
  title: 'Description',
  type: ColumnType.String,
  canFilter: false,
};

const LAIZE_COLUMN = {
  name: 'laize',
  title: 'Laize',
  type: ColumnType.Number,
  width: 60,
  canFilter: true,
};

const LONGUEUR_COLUMN = {
  name: 'longueur',
  title: 'Long.',
  type: ColumnType.Number,
  width: 60,
  canFilter: true,
};

const COULEUR_PAPIER_COLUMN = {
  name: 'couleurPapier',
  title: 'Couleur',
  type: ColumnType.String,
  width: 110,
  canFilter: true,
};

const GRAMMAGE_COLUMN = {
  name: 'grammage',
  title: 'Gram.',
  type: ColumnType.Number,
  width: 60,
  canFilter: true,
};

const STOCK_COLUMN = (stocks: StockIndex) => ({
  name: 'stock',
  title: 'Stocks',
  type: ColumnType.Number,
  sortFunction: getStocksSortFunction(stocks),
  width: 80,
  canFilter: false,
  renderCell: <T extends {ref: string}>(element: T) => getStock(element, stocks),
});

const TYPE_IMPRESSION_COLUMN = {
  name: 'typeImpression',
  title: 'Type Imp.',
  type: ColumnType.String,
  width: 90,
  canFilter: true,
};

const REF_CLICHE_COLUMN = (name: string) => ({
  name: 'refCliche1',
  title: 'Cliche 1',
  type: ColumnType.String,
  width: 90,
  canFilter: true,
});

const COULEUR_CLICHE_COLUMN = (index: number) => ({
  name: `couleur${index}`,
  title: `Couleur ${index}`,
  type: ColumnType.String,
  width: 70,
  canFilter: true,
});

const COULEURS_CLICHE_COLUMN = {
  name: 'couleursImpression',
  title: 'Couleurs Impression',
  type: ColumnType.String,
  sortFunction: sortBobineFilleClichePoseCouleursFunction,
  width: 160,
  canFilter: false,
  renderCell: (b: BobineFilleClichePose) => `[${b.couleursImpression.join(', ')}]`,
};

const IMPORTANCE_ORDRE_COULEUR_COLUMN = {
  name: 'importanceOrdreCouleurs',
  title: 'Ordre Imp.',
  type: ColumnType.Boolean,
  width: 90,
  canFilter: true,
};

const IS_REQUIRED_COLUMN = {
  name: 'required',
  title: 'Obligatoire',
  type: ColumnType.Boolean,
  width: 95,
  canFilter: true,
};

const LAST_UPDATE_COLUMN = {
  name: 'localUpdate',
  title: 'Date Modification',
  type: ColumnType.Date,
  width: 170,
  canFilter: false,
};

const LAIZE_PERFO_COLUMN = (index: number) => ({
  name: `laize${index}`,
  title: `Laize ${index}`,
  type: ColumnType.Number,
  canFilter: true,
});

const NOMBRE_POSES_COLUMN = {
  name: 'nombrePoses',
  title: 'Poses',
  type: ColumnType.String,
  sortFunction: sortClichesPosesFunction,
  width: 70,
  canFilter: false,
  renderCell: (cliche: Cliche) => `[${getPoses(cliche).join(', ')}]`,
};

const POSE_COLUMN = {
  name: 'pose',
  title: 'Pose',
  type: ColumnType.Number,
  width: 40,
  canFilter: false,
};

const DECALAGE_INITIAL_COLUMN = {
  name: 'decalageInitial',
  title: 'Decalage',
  type: ColumnType.Number,
  width: 70,
  canFilter: false,
};

const CALE_COLUMN = (index: number) => ({
  name: `cale${index}`,
  title: `Cale ${index}`,
  width: 57,
  type: ColumnType.Number,
  canFilter: true,
});

const BAGUE_COLUMN = (index: number) => ({
  name: `bague${index}`,
  title: `Bague ${index}`,
  type: ColumnType.Number,
  canFilter: true,
});

const REF_PERFO_COLUMN = {
  name: 'refPerfo',
  title: 'Ref Perfo',
  type: ColumnType.String,
  width: 70,
  canFilter: false,
};

const DECALAGE = {
  name: 'decalage',
  title: 'Decalage',
  type: ColumnType.Number,
  width: 70,
  canFilter: true,
};

const CHUTE_COLUMN = {
  name: 'chute',
  title: 'Chute',
  type: ColumnType.Number,
  width: 70,
  canFilter: true,
};

const OPERATION_CONSTRAINT_COLUMN = {
  name: 'constraint',
  title: 'Contrainte',
  type: ColumnType.String,
  width: 90,
  canFilter: true,
  renderCell(constraint: OperationConstraintModel): JSX.Element {
    return <OperationConstraint constraint={constraint} />;
  },
};

const DURATION_SECONDS_COLUMN = {
  name: 'duration',
  title: 'Temps',
  type: ColumnType.String,
  width: 90,
  canFilter: true,
  renderCell(duration: number): JSX.Element {
    return <Duration durationMs={duration * 1000} />;
  },
};

export const BobineFilleColumns = {
  Ref: REFERENCE_COLUMN(170),
  Designation: DESIGNATION_COLUMN,
  Laize: LAIZE_COLUMN,
  Longueur: LONGUEUR_COLUMN,
  CouleurPapier: COULEUR_PAPIER_COLUMN,
  Grammage: GRAMMAGE_COLUMN,
  TypeImpression: TYPE_IMPRESSION_COLUMN,
  RefCliche1: REF_CLICHE_COLUMN('refCliche1'),
  RefCliche2: REF_CLICHE_COLUMN('refCliche2'),
  Stock: STOCK_COLUMN,
  LastUpdate: LAST_UPDATE_COLUMN,
};

export const BobineFilleClichePoseColumns = {
  Ref: REFERENCE_COLUMN(170),
  Laize: LAIZE_COLUMN,
  CouleurPapier: COULEUR_PAPIER_COLUMN,
  Grammage: GRAMMAGE_COLUMN,
  Stock: STOCK_COLUMN,
  Pose: POSE_COLUMN,
  CouleursImpression: COULEURS_CLICHE_COLUMN,
  ImportanceOrdreCouleurs: IMPORTANCE_ORDRE_COULEUR_COLUMN,
  Longueur: LONGUEUR_COLUMN,
  TypeImpression: TYPE_IMPRESSION_COLUMN,
};

export const BobineMereColumns = {
  Ref: REFERENCE_COLUMN(170),
  Designation: DESIGNATION_COLUMN,
  Laize: LAIZE_COLUMN,
  Longueur: LONGUEUR_COLUMN,
  CouleurPapier: COULEUR_PAPIER_COLUMN,
  Grammage: GRAMMAGE_COLUMN,
  Stock: STOCK_COLUMN,
  LastUpdate: LAST_UPDATE_COLUMN,
};

export const ClicheColumns = {
  Ref: REFERENCE_COLUMN(80),
  Designation: DESIGNATION_COLUMN,
  NombrePoses: NOMBRE_POSES_COLUMN,
  Couleur1: COULEUR_CLICHE_COLUMN(1),
  Couleur2: COULEUR_CLICHE_COLUMN(2),
  Couleur3: COULEUR_CLICHE_COLUMN(3),
  ImportanceOrdreCouleurs: IMPORTANCE_ORDRE_COULEUR_COLUMN,
  LastUpdate: LAST_UPDATE_COLUMN,
};

export const PerfoColumns = {
  Ref: REFERENCE_COLUMN(70),
  DecalageInitial: DECALAGE_INITIAL_COLUMN,
  Cale1: CALE_COLUMN(1),
  Bague1: BAGUE_COLUMN(1),
  Cale2: CALE_COLUMN(2),
  Bague2: BAGUE_COLUMN(2),
  Cale3: CALE_COLUMN(3),
  Bague3: BAGUE_COLUMN(3),
  Cale4: CALE_COLUMN(4),
  Bague4: BAGUE_COLUMN(4),
  Cale5: CALE_COLUMN(5),
  Bague5: BAGUE_COLUMN(5),
  Cale6: CALE_COLUMN(6),
  Bague6: BAGUE_COLUMN(6),
  Cale7: CALE_COLUMN(7),
  Bague7: BAGUE_COLUMN(7),
  LastUpdate: LAST_UPDATE_COLUMN,
};

export const RefenteColumns = {
  Ref: REFERENCE_COLUMN(70),
  RefPerfo: REF_PERFO_COLUMN,
  Decalage: DECALAGE,
  Laize1: LAIZE_PERFO_COLUMN(1),
  Laize2: LAIZE_PERFO_COLUMN(2),
  Laize3: LAIZE_PERFO_COLUMN(3),
  Laize4: LAIZE_PERFO_COLUMN(4),
  Laize5: LAIZE_PERFO_COLUMN(5),
  Laize6: LAIZE_PERFO_COLUMN(6),
  Laize7: LAIZE_PERFO_COLUMN(7),
  Chute: CHUTE_COLUMN,
  LastUpdate: LAST_UPDATE_COLUMN,
};

export const OperationColumns = {
  Id: ID_COLUMN(30),
  Description: DESCRIPTION_COLUMN,
  Required: IS_REQUIRED_COLUMN,
  Constraint: OPERATION_CONSTRAINT_COLUMN,
  Duration: DURATION_SECONDS_COLUMN,
  LastUpdate: LAST_UPDATE_COLUMN,
};
// tslint:enable:no-magic-numbers
