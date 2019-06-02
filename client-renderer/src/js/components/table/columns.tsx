import {sum} from 'lodash-es';
import * as React from 'react';

import {Duration} from '@root/components/common/duration';
import {OperationConstraint} from '@root/components/common/operation_constraint';
import {ColumnType} from '@root/components/table/column';
import {BobineFilleClichePose} from '@root/lib/plan_production/model';

import {Stock, Cliche, Perfo, Refente, Operation} from '@shared/models';
import {asMap, asString, asNumber} from '@shared/type_utils';

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
});

const ID_COLUMN = (width: number) => ({
  name: 'id',
  title: 'Id',
  type: ColumnType.Number,
  width,
});

const DESIGNATION_COLUMN = {
  name: 'designation',
  title: 'Designation',
  type: ColumnType.String,
};

const DESCRIPTION_COLUMN = {
  name: 'description',
  title: 'Description',
  type: ColumnType.String,
};

const LAIZE_COLUMN = {
  name: 'laize',
  title: 'Laize',
  type: ColumnType.Number,
  width: 70,
  filter: {
    getValue: (row: {laize: number}) => row.laize,
  },
};

const LONGUEUR_COLUMN = {
  name: 'longueur',
  title: 'Long.',
  type: ColumnType.Number,
  width: 70,
  filter: {
    getValue: (row: {longueur: number}) => row.longueur,
  },
};

const COULEUR_PAPIER_COLUMN = {
  name: 'couleurPapier',
  title: 'Couleur',
  type: ColumnType.String,
  width: 110,
  filter: {
    getValue: (row: {couleurPapier: string}) => row.couleurPapier,
  },
};

const GRAMMAGE_COLUMN = {
  name: 'grammage',
  title: 'Gram.',
  type: ColumnType.Number,
  width: 70,
  filter: {
    getValue: (row: {grammage: number}) => row.grammage,
  },
};

const STOCK_COLUMN = (stocks: StockIndex) => ({
  name: 'stock',
  title: 'Stocks',
  type: ColumnType.Number,
  sortFunction: getStocksSortFunction(stocks),
  width: 80,
  renderCell: <T extends {ref: string}>(element: T) => getStock(element, stocks),
});

const TYPE_IMPRESSION_COLUMN = {
  name: 'typeImpression',
  title: 'Type Imp.',
  type: ColumnType.String,
  width: 90,
  // canFilter: true,
};

const REF_CLICHE_COLUMN = (name: string, title: string) => ({
  name,
  title,
  type: ColumnType.String,
  width: 90,
});

const COULEUR_CLICHE_COLUMN = (index: number) => ({
  name: `couleur${index}`,
  title: `Couleur ${index}`,
  type: ColumnType.String,
  width: 70,
  filter: {
    getValue: (row: Cliche) => asString(asMap(row)[`couleur${index}`], ''),
  },
});

const COULEURS_CLICHE_COLUMN = {
  name: 'couleursImpression',
  title: 'Couleurs Impression',
  type: ColumnType.String,
  sortFunction: sortBobineFilleClichePoseCouleursFunction,
  width: 160,
  renderCell: (b: BobineFilleClichePose) => `[${b.couleursImpression.join(', ')}]`,
};

const IMPORTANCE_ORDRE_COULEUR_COLUMN = {
  name: 'importanceOrdreCouleurs',
  title: 'Ordre Imp.',
  type: ColumnType.Boolean,
  width: 90,
  filter: {
    getValue: (row: {importanceOrdreCouleurs: boolean}) => row.importanceOrdreCouleurs,
  },
};

const IS_REQUIRED_COLUMN = {
  name: 'required',
  title: 'Obligatoire',
  type: ColumnType.Boolean,
  width: 110,
  filter: {
    getValue: (row: {required: boolean}) => row.required,
  },
};

const LAST_UPDATE_COLUMN = {
  name: 'localUpdate',
  title: 'Date Modification',
  type: ColumnType.Date,
  width: 170,
};

const LAIZE_REFENTE_COLUMN = (index: number) => ({
  name: `laize${index}`,
  title: `Laize ${index}`,
  type: ColumnType.Number,
  filter: {
    getValue: (row: Refente) => asNumber(asMap(row)[`laize${index}`], 0),
  },
});

const NOMBRE_POSES_COLUMN = {
  name: 'nombrePoses',
  title: 'Poses',
  type: ColumnType.String,
  sortFunction: sortClichesPosesFunction,
  width: 70,
  renderCell: (cliche: Cliche) => `[${getPoses(cliche).join(', ')}]`,
};

const POSE_COLUMN = {
  name: 'pose',
  title: 'Pose',
  type: ColumnType.Number,
  width: 60,
  filter: {
    getValue: (row: {pose: number}) => row.pose,
  },
};

const DECALAGE_INITIAL_COLUMN = {
  name: 'decalageInitial',
  title: 'Decalage',
  type: ColumnType.Number,
  width: 70,
  filter: {
    getValue: (row: {decalageInitial: number}) => row.decalageInitial,
  },
};

const CALE_COLUMN = (index: number) => ({
  name: `cale${index}`,
  title: `Cale ${index}`,
  width: 70,
  type: ColumnType.Number,
  filter: {
    getValue: (row: Perfo) => asNumber(asMap(row)[`cale${index}`], 0),
  },
});

const BAGUE_COLUMN = (index: number) => ({
  name: `bague${index}`,
  title: `Bague ${index}`,
  type: ColumnType.Number,
  filter: {
    getValue: (row: Perfo) => asNumber(asMap(row)[`bague${index}`], 0),
  },
});

const REF_PERFO_COLUMN = {
  name: 'refPerfo',
  title: 'Ref Perfo',
  type: ColumnType.String,
  width: 70,
};

const DECALAGE = {
  name: 'decalage',
  title: 'Decalage',
  type: ColumnType.Number,
  width: 70,
  filter: {
    getValue: (row: {decalage: number}) => row.decalage,
  },
};

const CHUTE_COLUMN = {
  name: 'chute',
  title: 'Chute',
  type: ColumnType.Number,
  width: 80,
  filter: {
    getValue: (row: {chute: number}) => row.chute,
  },
};

const OPERATION_CONSTRAINT_COLUMN = {
  name: 'constraint',
  title: 'Contrainte',
  type: ColumnType.String,
  renderCell(operation: Operation): JSX.Element {
    return <OperationConstraint constraint={operation.constraint} />;
  },
};

const DURATION_SECONDS_COLUMN = {
  name: 'duration',
  title: 'Temps',
  type: ColumnType.String,
  width: 90,
  renderCell(operation: Operation): JSX.Element {
    return <Duration durationMs={operation.duration} />;
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
  RefCliche1: REF_CLICHE_COLUMN('refCliche1', 'Cliché 1'),
  RefCliche2: REF_CLICHE_COLUMN('refCliche2', 'Cliché 2'),
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
  Laize1: LAIZE_REFENTE_COLUMN(1),
  Laize2: LAIZE_REFENTE_COLUMN(2),
  Laize3: LAIZE_REFENTE_COLUMN(3),
  Laize4: LAIZE_REFENTE_COLUMN(4),
  Laize5: LAIZE_REFENTE_COLUMN(5),
  Laize6: LAIZE_REFENTE_COLUMN(6),
  Laize7: LAIZE_REFENTE_COLUMN(7),
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
