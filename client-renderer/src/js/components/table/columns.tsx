import {isEqual} from 'lodash-es';
import * as React from 'react';

import {AddPoseButtons} from '@root/components/common/add_pose_buttons';
import {BobineColors} from '@root/components/common/bobine_colors';
import {Color} from '@root/components/common/color';
import {Duration} from '@root/components/common/duration';
import {
  OperationConstraint,
  ConstraintDescriptions,
} from '@root/components/common/operation_constraint';
import {RefLink} from '@root/components/common/ref_link';
import {ColumnMetadata} from '@root/components/table/sortable_table';
import {getStock, getBobineSellingPastYear} from '@root/lib/bobine';
import {bridge} from '@root/lib/bridge';
import {Colors} from '@root/theme/default';

import {dedupePoseNeutre} from '@shared/lib/bobines_filles';
import {BobineColors as BobineColorsModel} from '@shared/lib/encrier';
import {
  Stock,
  Cliche,
  OperationConstraint as OperationConstraintModel,
  BobineFilleWithMultiPose,
} from '@shared/models';

function getStocksSortFunction<T extends {ref: string}>(
  stocks: Map<string, Stock[]>
): (d1: T, d2: T) => number {
  return function(data1: T, data2: T): number {
    const s1 = getStock(data1.ref, stocks);
    const s2 = getStock(data2.ref, stocks);
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

function optionalSort<T>(
  opt1: T | undefined,
  opt2: T | undefined,
  cmp: (val1: T, val2: T) => number
): number {
  if (opt1 === undefined && opt2 === undefined) {
    return 0;
  }
  if (opt1 === undefined) {
    return 1;
  }
  if (opt2 === undefined) {
    return -1;
  }
  return cmp(opt1, opt2);
}

const stringSort = (val1: string, val2: string) => {
  if (val1 === val2) {
    return 0;
  }
  if (val1 === '') {
    return 1;
  }
  if (val2 === '') {
    return -1;
  }
  return val1.toLowerCase().localeCompare(val2.toLowerCase());
};
const numberSort = (val1: number, val2: number) => val1 - val2;
const booleanSort = (val1: boolean, val2: boolean) => (val1 && val2 ? 0 : val1 ? 1 : -1);

const optionalStringSort = (opt1?: string, opt2?: string) => optionalSort(opt1, opt2, stringSort);
const optionalNumberSort = (opt1?: number, opt2?: number) => optionalSort(opt1, opt2, numberSort);
const optionalBooleanSort = (opt1?: boolean, opt2?: boolean) =>
  optionalSort(opt1, opt2, booleanSort);

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

// function sortBobineFilleClichePoseCouleursFunction(
//   b1: BobineFilleClichePose,
//   b2: BobineFilleClichePose
// ): number {
//   return sortArrayFunction(b1.couleursImpression, b2.couleursImpression, true, (el1, el2) =>
//     el1.toLowerCase().localeCompare(el2.toLowerCase())
//   );
// }

function renderString(value?: string): JSX.Element {
  return <span>{value === undefined ? '-' : value}</span>;
}

function renderNumber(value?: number): JSX.Element {
  return <div style={{textAlign: 'center'}}>{value === undefined ? '-' : value}</div>;
}

function renderDate(value?: number): JSX.Element {
  return <span>{value ? new Date(value).toLocaleString('fr') : '-'}</span>;
}

function renderBoolean(value?: boolean): JSX.Element {
  return <span>{value === undefined ? '-' : value ? 'OUI' : 'NON'}</span>;
}

// tslint:disable:no-magic-numbers
export const REFERENCE_COLUMN = (width: number): ColumnMetadata<{ref: string}, string> => ({
  title: 'Reference',
  width,
  renderCell: ({ref}) => renderString(ref),
  getSearchValue: row => row.ref,
  sortFunction: (row1, row2) => stringSort(row1.ref, row2.ref),
  shouldRerender: (row1, row2) => row1.ref !== row2.ref,
});

export const BOBINE_FILLE_REF: ColumnMetadata<{ref: string}, string> = {
  title: 'Reference',
  width: 190,
  renderCell: ({ref}) => (
    <RefLink onClick={() => bridge.viewBobine(ref).catch(console.error)} color={Colors.secondary}>
      {ref}
    </RefLink>
  ),
  getSearchValue: row => row.ref || '',
  sortFunction: (row1, row2) => optionalStringSort(row1.ref, row2.ref),
  shouldRerender: (row1, row2) => row1.ref !== row2.ref,
};

export const ID_COLUMN = (width: number): ColumnMetadata<{id: number}, number> => ({
  title: 'Id',
  width,
  renderCell: ({id}) => renderNumber(id),
  getSearchValue: row => String(row.id),
  sortFunction: (row1, row2) => numberSort(row1.id, row2.id),
  shouldRerender: (row1, row2) => row1.id !== row2.id,
});

export const DESIGNATION_COLUMN: ColumnMetadata<{designation?: string}, string> = {
  title: 'Designation',
  renderCell: ({designation}) => renderString(designation),
  getSearchValue: row => row.designation || '',
  sortFunction: (row1, row2) => optionalStringSort(row1.designation, row2.designation),
  shouldRerender: (row1, row2) => row1.designation !== row2.designation,
};

export const DESCRIPTION_COLUMN: ColumnMetadata<{description?: string}, string> = {
  title: 'Description',
  renderCell: ({description}) => renderString(description),
  getSearchValue: row => row.description || '',
  sortFunction: (row1, row2) => optionalStringSort(row1.description, row2.description),
  shouldRerender: (row1, row2) => row1.description !== row2.description,
};

export const LAIZE_COLUMN: ColumnMetadata<{laize?: number}, number> = {
  title: 'Laize',
  width: 70,
  renderCell: ({laize}) => renderNumber(laize),
  sortFunction: (row1, row2) => optionalNumberSort(row1.laize, row2.laize),
  filter: {
    getValue: (row: {laize?: number}) => row.laize || 0,
  },
  shouldRerender: (row1, row2) => row1.laize !== row2.laize,
};

export const LONGUEUR_COLUMN: ColumnMetadata<{longueur?: number}, number> = {
  title: 'Long.',
  width: 80,
  renderCell: ({longueur}) => renderNumber(longueur),
  sortFunction: (row1, row2) => optionalNumberSort(row1.longueur, row2.longueur),
  filter: {
    getValue: (row: {longueur?: number}) => row.longueur || 0,
  },
  shouldRerender: (row1, row2) => row1.longueur !== row2.longueur,
};

export const COULEUR_PAPIER_COLUMN: ColumnMetadata<{couleurPapier?: string}, string> = {
  title: 'Couleur',
  width: 80,
  renderCell: ({couleurPapier}) =>
    couleurPapier ? (
      <div style={{display: 'flex', alignItems: 'center', height: '100%'}}>
        <Color color={couleurPapier} />
      </div>
    ) : (
      <React.Fragment />
    ),
  getSearchValue: row => row.couleurPapier || '',
  sortFunction: (row1, row2) => optionalStringSort(row1.couleurPapier, row2.couleurPapier),
  filter: {
    getValue: (row: {couleurPapier?: string}) => row.couleurPapier || '?',
  },
  shouldRerender: (row1, row2) => row1.couleurPapier !== row2.couleurPapier,
};

function listBobineColors(colors: BobineColorsModel): string[] {
  return colors.ordered.map(c => c.color).concat(colors.nonOrdered.map(c => c.color));
}

export const COULEURS_IMPRESSION_COLUMN: ColumnMetadata<{colors: BobineColorsModel}, string> = {
  title: 'Impression',
  width: 215,
  renderCell: ({colors}) => <BobineColors style={{height: '100%'}} bobineColors={colors} />,
  // getSearchValue: row => row.couleursImpression.join(', '),
  sortFunction: (row1, row2) =>
    sortArrayFunction(
      listBobineColors(row1.colors),
      listBobineColors(row2.colors),
      true,
      stringSort
    ),
  // filter: {
  //   getValue: row => row.couleursImpression.join(', '),
  // },
  shouldRerender: (row1, row2) => isEqual(row1.colors, row2.colors),
};

export const GRAMMAGE_COLUMN: ColumnMetadata<{grammage?: number}, number> = {
  title: 'Gram.',
  width: 80,
  renderCell: ({grammage}) => renderNumber(grammage),
  sortFunction: (row1, row2) => optionalNumberSort(row1.grammage, row2.grammage),
  filter: {
    getValue: (row: {grammage?: number}) => row.grammage || 0,
  },
  shouldRerender: (row1, row2) => row1.grammage !== row2.grammage,
};

export const STOCK_COLUMN = (
  stocks: Map<string, Stock[]>
): ColumnMetadata<{ref: string}, number> => ({
  title: 'Stocks',
  width: 80,
  renderCell: row => renderNumber(getStock(row.ref, stocks)),
  getSearchValue: row => row.ref,
  sortFunction: getStocksSortFunction(stocks),
  shouldRerender: (row1, row2) => row1.ref !== row2.ref,
});

export const TYPE_IMPRESSION_COLUMN: ColumnMetadata<{typeImpression?: string}, string> = {
  title: 'Type Imp.',
  width: 90,
  renderCell: ({typeImpression}) => renderString(typeImpression),
  getSearchValue: row => row.typeImpression || '',
  sortFunction: (row1, row2) => optionalStringSort(row1.typeImpression, row2.typeImpression),
  shouldRerender: (row1, row2) => row1.typeImpression !== row2.typeImpression,
};

export const REF_CLICHE1_COLUMN: ColumnMetadata<{refCliche1?: string}, string> = {
  title: 'Ref cliché 1',
  width: 90,
  renderCell: ({refCliche1}) => renderString(refCliche1),
  getSearchValue: row => row.refCliche1 || '',
  sortFunction: (row1, row2) => optionalStringSort(row1.refCliche1, row2.refCliche1),
  shouldRerender: (row1, row2) => row1.refCliche1 !== row2.refCliche1,
};

export const REF_CLICHE2_COLUMN: ColumnMetadata<{refCliche2?: string}, string> = {
  title: 'Ref cliché 2',
  width: 90,
  renderCell: ({refCliche2}) => renderString(refCliche2),
  getSearchValue: row => row.refCliche2 || '',
  sortFunction: (row1, row2) => optionalStringSort(row1.refCliche2, row2.refCliche2),
  shouldRerender: (row1, row2) => row1.refCliche2 !== row2.refCliche2,
};

export const COULEUR1_CLICHE_COLUMN: ColumnMetadata<{couleur1?: string}, string> = {
  title: 'Couleur 1',
  width: 70,
  renderCell: ({couleur1}) => renderString(couleur1),
  getSearchValue: row => row.couleur1 || '',
  sortFunction: (row1, row2) => optionalStringSort(row1.couleur1, row2.couleur1),
  shouldRerender: (row1, row2) => row1.couleur1 !== row2.couleur1,
};

export const COULEUR2_CLICHE_COLUMN: ColumnMetadata<{couleur2?: string}, string> = {
  title: 'Couleur 2',
  width: 70,
  renderCell: ({couleur2}) => renderString(couleur2),
  getSearchValue: row => row.couleur2 || '',
  sortFunction: (row1, row2) => optionalStringSort(row1.couleur2, row2.couleur2),
  shouldRerender: (row1, row2) => row1.couleur2 !== row2.couleur2,
};

export const COULEUR3_CLICHE_COLUMN: ColumnMetadata<{couleur3?: string}, string> = {
  title: 'Couleur 3',
  width: 70,
  renderCell: ({couleur3}) => renderString(couleur3),
  getSearchValue: row => row.couleur3 || '',
  sortFunction: (row1, row2) => optionalStringSort(row1.couleur3, row2.couleur3),
  shouldRerender: (row1, row2) => row1.couleur3 !== row2.couleur3,
};

export const IMPORTANCE_ORDRE_COULEUR_COLUMN: ColumnMetadata<
  {importanceOrdreCouleurs?: boolean},
  boolean
> = {
  title: 'Ordre Imp.',
  width: 90,
  renderCell: ({importanceOrdreCouleurs}) => renderBoolean(importanceOrdreCouleurs),
  sortFunction: (row1, row2) =>
    optionalBooleanSort(row1.importanceOrdreCouleurs, row2.importanceOrdreCouleurs),
  filter: {
    getValue: (row: {importanceOrdreCouleurs: boolean}) => row.importanceOrdreCouleurs,
  },
  shouldRerender: (row1, row2) => row1.importanceOrdreCouleurs !== row2.importanceOrdreCouleurs,
};

export const IS_REQUIRED_COLUMN: ColumnMetadata<{required?: boolean}, boolean> = {
  title: 'Obligatoire',
  width: 110,
  renderCell: ({required}) => renderBoolean(required),
  sortFunction: (row1, row2) => optionalBooleanSort(row1.required, row2.required),
  filter: {
    getValue: (row: {required: boolean}) => row.required,
  },
  shouldRerender: (row1, row2) => row1.required !== row2.required,
};

export const LAST_UPDATE_COLUMN: ColumnMetadata<{localUpdate: number}, number> = {
  title: 'Date Modification',
  width: 170,
  renderCell: ({localUpdate}) => renderDate(localUpdate),
  sortFunction: (row1, row2) => numberSort(row1.localUpdate, row2.localUpdate),
  shouldRerender: (row1, row2) => {
    return row1.localUpdate !== row2.localUpdate;
  },
};

export const LAIZE1_REFENTE_COLUMN: ColumnMetadata<{laize1?: number}, number> = {
  title: 'Laize 1',
  renderCell: ({laize1}) => renderNumber(laize1),
  sortFunction: (row1, row2) => optionalNumberSort(row1.laize1, row2.laize1),
  filter: {
    getValue: (row: {laize1?: number}) => row.laize1 || 0,
  },
  shouldRerender: (row1, row2) => row1.laize1 !== row2.laize1,
};

export const LAIZE2_REFENTE_COLUMN: ColumnMetadata<{laize2?: number}, number> = {
  title: 'Laize 2',
  renderCell: ({laize2}) => renderNumber(laize2),
  sortFunction: (row1, row2) => optionalNumberSort(row1.laize2, row2.laize2),
  filter: {
    getValue: (row: {laize2?: number}) => row.laize2 || 0,
  },
  shouldRerender: (row1, row2) => row1.laize2 !== row2.laize2,
};

export const LAIZE3_REFENTE_COLUMN: ColumnMetadata<{laize3?: number}, number> = {
  title: 'Laize 3',
  renderCell: ({laize3}) => renderNumber(laize3),
  sortFunction: (row1, row2) => optionalNumberSort(row1.laize3, row2.laize3),
  filter: {
    getValue: (row: {laize3?: number}) => row.laize3 || 0,
  },
  shouldRerender: (row1, row2) => row1.laize3 !== row2.laize3,
};

export const LAIZE4_REFENTE_COLUMN: ColumnMetadata<{laize4?: number}, number> = {
  title: 'Laize 4',
  renderCell: ({laize4}) => renderNumber(laize4),
  sortFunction: (row1, row2) => optionalNumberSort(row1.laize4, row2.laize4),
  filter: {
    getValue: (row: {laize4?: number}) => row.laize4 || 0,
  },
  shouldRerender: (row1, row2) => row1.laize4 !== row2.laize4,
};

export const LAIZE5_REFENTE_COLUMN: ColumnMetadata<{laize5?: number}, number> = {
  title: 'Laize 5',
  renderCell: ({laize5}) => renderNumber(laize5),
  sortFunction: (row1, row2) => optionalNumberSort(row1.laize5, row2.laize5),
  filter: {
    getValue: (row: {laize5?: number}) => row.laize5 || 0,
  },
  shouldRerender: (row1, row2) => row1.laize5 !== row2.laize5,
};

export const LAIZE6_REFENTE_COLUMN: ColumnMetadata<{laize6?: number}, number> = {
  title: 'Laize 6',
  renderCell: ({laize6}) => renderNumber(laize6),
  sortFunction: (row1, row2) => optionalNumberSort(row1.laize6, row2.laize6),
  filter: {
    getValue: (row: {laize6?: number}) => row.laize6 || 0,
  },
  shouldRerender: (row1, row2) => row1.laize6 !== row2.laize6,
};

export const LAIZE7_REFENTE_COLUMN: ColumnMetadata<{laize7?: number}, number> = {
  title: 'Laize 7',
  renderCell: ({laize7}) => renderNumber(laize7),
  sortFunction: (row1, row2) => optionalNumberSort(row1.laize7, row2.laize7),
  filter: {
    getValue: (row: {laize7?: number}) => row.laize7 || 0,
  },
  shouldRerender: (row1, row2) => row1.laize7 !== row2.laize7,
};

export const NOMBRE_POSES_COLUMN: ColumnMetadata<Cliche, Cliche> = {
  title: 'Poses',
  width: 70,
  sortFunction: sortClichesPosesFunction,
  renderCell: (cliche: Cliche) => `[${getPoses(cliche).join(', ')}]`,
  shouldRerender: (row1, row2) => row1.ref !== row2.ref,
};

export const POSE_COLUMN: ColumnMetadata<{pose?: number}, number> = {
  title: 'Pose',
  width: 60,
  renderCell: ({pose}) => renderNumber(pose),
  sortFunction: (row1, row2) => optionalNumberSort(row1.pose, row2.pose),
  filter: {
    getValue: (row: {pose: number}) => row.pose,
  },
  shouldRerender: (row1, row2) => row1.pose !== row2.pose,
};

export const MULTI_POSE_COLUMN: ColumnMetadata<BobineFilleWithMultiPose, string> = {
  title: 'Poses',
  width: 200,
  renderCell: bobine => <AddPoseButtons bobine={bobine} />,
  sortFunction: (row1, row2) =>
    sortArrayFunction(
      dedupePoseNeutre(row1.availablePoses),
      dedupePoseNeutre(row2.availablePoses),
      true,
      numberSort
    ),
  shouldRerender: (row1, row2) => isEqual(row1.availablePoses, row2.availablePoses),
};

export const DECALAGE_INITIAL_COLUMN: ColumnMetadata<{decalageInitial?: number}, number> = {
  title: 'Décalage',
  width: 70,
  renderCell: ({decalageInitial}) => renderNumber(decalageInitial),
  sortFunction: (row1, row2) => optionalNumberSort(row1.decalageInitial, row2.decalageInitial),
  filter: {
    getValue: (row: {decalageInitial: number}) => row.decalageInitial,
  },
  shouldRerender: (row1, row2) => row1.decalageInitial !== row2.decalageInitial,
};

export const CALE1_COLUMN: ColumnMetadata<{cale1?: number}, number> = {
  title: 'Cale 1',
  width: 70,
  renderCell: ({cale1}) => renderNumber(cale1),
  sortFunction: (row1, row2) => optionalNumberSort(row1.cale1, row2.cale1),
  filter: {
    getValue: (row: {cale1?: number}) => row.cale1 || 0,
  },
  shouldRerender: (row1, row2) => row1.cale1 !== row2.cale1,
};

export const CALE2_COLUMN: ColumnMetadata<{cale2?: number}, number> = {
  title: 'Cale 2',
  width: 70,
  renderCell: ({cale2}) => renderNumber(cale2),
  sortFunction: (row1, row2) => optionalNumberSort(row1.cale2, row2.cale2),
  filter: {
    getValue: (row: {cale2?: number}) => row.cale2 || 0,
  },
  shouldRerender: (row1, row2) => row1.cale2 !== row2.cale2,
};

export const CALE3_COLUMN: ColumnMetadata<{cale3?: number}, number> = {
  title: 'Cale 3',
  width: 70,
  renderCell: ({cale3}) => renderNumber(cale3),
  sortFunction: (row1, row2) => optionalNumberSort(row1.cale3, row2.cale3),
  filter: {
    getValue: (row: {cale3?: number}) => row.cale3 || 0,
  },
  shouldRerender: (row1, row2) => row1.cale3 !== row2.cale3,
};

export const CALE4_COLUMN: ColumnMetadata<{cale4?: number}, number> = {
  title: 'Cale 4',
  width: 70,
  renderCell: ({cale4}) => renderNumber(cale4),
  sortFunction: (row1, row2) => optionalNumberSort(row1.cale4, row2.cale4),
  filter: {
    getValue: (row: {cale4?: number}) => row.cale4 || 0,
  },
  shouldRerender: (row1, row2) => row1.cale4 !== row2.cale4,
};

export const CALE5_COLUMN: ColumnMetadata<{cale5?: number}, number> = {
  title: 'Cale 5',
  width: 70,
  renderCell: ({cale5}) => renderNumber(cale5),
  sortFunction: (row1, row2) => optionalNumberSort(row1.cale5, row2.cale5),
  filter: {
    getValue: (row: {cale5?: number}) => row.cale5 || 0,
  },
  shouldRerender: (row1, row2) => row1.cale5 !== row2.cale5,
};

export const CALE6_COLUMN: ColumnMetadata<{cale6?: number}, number> = {
  title: 'Cale 6',
  width: 70,
  renderCell: ({cale6}) => renderNumber(cale6),
  sortFunction: (row1, row2) => optionalNumberSort(row1.cale6, row2.cale6),
  filter: {
    getValue: (row: {cale6?: number}) => row.cale6 || 0,
  },
  shouldRerender: (row1, row2) => row1.cale6 !== row2.cale6,
};

export const CALE7_COLUMN: ColumnMetadata<{cale7?: number}, number> = {
  title: 'Cale 7',
  width: 70,
  renderCell: ({cale7}) => renderNumber(cale7),
  sortFunction: (row1, row2) => optionalNumberSort(row1.cale7, row2.cale7),
  filter: {
    getValue: (row: {cale7?: number}) => row.cale7 || 0,
  },
  shouldRerender: (row1, row2) => row1.cale7 !== row2.cale7,
};

export const BAGUE1_COLUMN: ColumnMetadata<{bague1?: number}, number> = {
  title: 'Bague 1',
  renderCell: ({bague1}) => renderNumber(bague1),
  sortFunction: (row1, row2) => optionalNumberSort(row1.bague1, row2.bague1),
  filter: {
    getValue: (row: {bague1?: number}) => row.bague1 || 0,
  },
  shouldRerender: (row1, row2) => row1.bague1 !== row2.bague1,
};

export const BAGUE2_COLUMN: ColumnMetadata<{bague2?: number}, number> = {
  title: 'Bague 2',
  renderCell: ({bague2}) => renderNumber(bague2),
  sortFunction: (row1, row2) => optionalNumberSort(row1.bague2, row2.bague2),
  filter: {
    getValue: (row: {bague2?: number}) => row.bague2 || 0,
  },
  shouldRerender: (row1, row2) => row1.bague2 !== row2.bague2,
};

export const BAGUE3_COLUMN: ColumnMetadata<{bague3?: number}, number> = {
  title: 'Bague 3',
  renderCell: ({bague3}) => renderNumber(bague3),
  sortFunction: (row1, row2) => optionalNumberSort(row1.bague3, row2.bague3),
  filter: {
    getValue: (row: {bague3?: number}) => row.bague3 || 0,
  },
  shouldRerender: (row1, row2) => row1.bague3 !== row2.bague3,
};

export const BAGUE4_COLUMN: ColumnMetadata<{bague4?: number}, number> = {
  title: 'Bague 4',
  renderCell: ({bague4}) => renderNumber(bague4),
  sortFunction: (row1, row2) => optionalNumberSort(row1.bague4, row2.bague4),
  filter: {
    getValue: (row: {bague4?: number}) => row.bague4 || 0,
  },
  shouldRerender: (row1, row2) => row1.bague4 !== row2.bague4,
};

export const BAGUE5_COLUMN: ColumnMetadata<{bague5?: number}, number> = {
  title: 'Bague 5',
  renderCell: ({bague5}) => renderNumber(bague5),
  sortFunction: (row1, row2) => optionalNumberSort(row1.bague5, row2.bague5),
  filter: {
    getValue: (row: {bague5?: number}) => row.bague5 || 0,
  },
  shouldRerender: (row1, row2) => row1.bague5 !== row2.bague5,
};

export const BAGUE6_COLUMN: ColumnMetadata<{bague6?: number}, number> = {
  title: 'Bague 6',
  renderCell: ({bague6}) => renderNumber(bague6),
  sortFunction: (row1, row2) => optionalNumberSort(row1.bague6, row2.bague6),
  filter: {
    getValue: (row: {bague6?: number}) => row.bague6 || 0,
  },
  shouldRerender: (row1, row2) => row1.bague6 !== row2.bague6,
};

export const BAGUE7_COLUMN: ColumnMetadata<{bague7?: number}, number> = {
  title: 'Bague 7',
  renderCell: ({bague7}) => renderNumber(bague7),
  sortFunction: (row1, row2) => optionalNumberSort(row1.bague7, row2.bague7),
  filter: {
    getValue: (row: {bague7?: number}) => row.bague7 || 0,
  },
  shouldRerender: (row1, row2) => row1.bague7 !== row2.bague7,
};

export const REF_PERFO_COLUMN: ColumnMetadata<{refPerfo: string}, string> = {
  title: 'Ref Perfo',
  width: 70,
  renderCell: ({refPerfo}) => renderString(refPerfo),
  getSearchValue: row => row.refPerfo || '',
  sortFunction: (row1, row2) => optionalStringSort(row1.refPerfo, row2.refPerfo),
  shouldRerender: (row1, row2) => row1.refPerfo !== row2.refPerfo,
};

export const DECALAGE_COLUMN: ColumnMetadata<{decalage?: number}, number> = {
  title: 'Décalage',
  width: 70,
  renderCell: ({decalage}) => renderNumber(decalage),
  sortFunction: (row1, row2) => optionalNumberSort(row1.decalage, row2.decalage),
  filter: {
    getValue: (row: {decalage: number}) => row.decalage,
  },
  shouldRerender: (row1, row2) => row1.decalage !== row2.decalage,
};

export const CHUTE_COLUMN: ColumnMetadata<{chute?: number}, number> = {
  title: 'Chute',
  width: 80,
  renderCell: ({chute}) => renderNumber(chute),
  sortFunction: (row1, row2) => optionalNumberSort(row1.chute, row2.chute),
  filter: {
    getValue: (row: {chute: number}) => row.chute,
  },
  shouldRerender: (row1, row2) => row1.chute !== row2.chute,
};

export const OPERATION_CONSTRAINT_COLUMN: ColumnMetadata<
  {constraint: OperationConstraintModel},
  string
> = {
  title: 'Contrainte',
  renderCell: ({constraint}) => <OperationConstraint constraint={constraint} />,
  sortFunction: (row1, row2) =>
    optionalStringSort(
      ConstraintDescriptions.get(row1.constraint),
      ConstraintDescriptions.get(row2.constraint)
    ),
  filter: {
    getValue: ({constraint}) => ConstraintDescriptions.get(constraint) || '?',
  },
  shouldRerender: (row1, row2) => row1.constraint !== row2.constraint,
};

export const DURATION_SECONDS_COLUMN: ColumnMetadata<{duration: number}, string> = {
  title: 'Temps',
  width: 90,
  renderCell: ({duration}) => <Duration durationMs={duration} />,
  sortFunction: (row1, row2) => numberSort(row1.duration, row2.duration),
  shouldRerender: (row1, row2) => row1.duration !== row2.duration,
};

export const LAST_YEAR_SELLING = (
  cadencier: Map<string, Map<number, number>>
): ColumnMetadata<{ref: string}, number> => ({
  title: 'Vente',
  width: 90,
  renderCell: ({ref}) => renderNumber(getBobineSellingPastYear(cadencier.get(ref))),
  sortFunction: (row1, row2) =>
    numberSort(
      getBobineSellingPastYear(cadencier.get(row1.ref)),
      getBobineSellingPastYear(cadencier.get(row2.ref))
    ),
  shouldRerender: (row1, row2) =>
    getBobineSellingPastYear(cadencier.get(row1.ref)) !==
    getBobineSellingPastYear(cadencier.get(row2.ref)),
});

export const BobineFilleColumns = {
  Ref: REFERENCE_COLUMN(170),
  Designation: DESIGNATION_COLUMN,
  Laize: LAIZE_COLUMN,
  Longueur: LONGUEUR_COLUMN,
  CouleurPapier: COULEUR_PAPIER_COLUMN,
  Grammage: GRAMMAGE_COLUMN,
  TypeImpression: TYPE_IMPRESSION_COLUMN,
  RefCliche1: REF_CLICHE1_COLUMN,
  RefCliche2: REF_CLICHE2_COLUMN,
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
  // CouleursImpression: COULEURS_CLICHE_COLUMN,
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
  Couleur1: COULEUR1_CLICHE_COLUMN,
  Couleur2: COULEUR2_CLICHE_COLUMN,
  Couleur3: COULEUR3_CLICHE_COLUMN,
  ImportanceOrdreCouleurs: IMPORTANCE_ORDRE_COULEUR_COLUMN,
  LastUpdate: LAST_UPDATE_COLUMN,
};

export const PerfoColumns = {
  Ref: REFERENCE_COLUMN(70),
  DecalageInitial: DECALAGE_INITIAL_COLUMN,
  Cale1: CALE1_COLUMN,
  Bague1: BAGUE1_COLUMN,
  Cale2: CALE2_COLUMN,
  Bague2: BAGUE2_COLUMN,
  Cale3: CALE3_COLUMN,
  Bague3: BAGUE3_COLUMN,
  Cale4: CALE4_COLUMN,
  Bague4: BAGUE4_COLUMN,
  Cale5: CALE5_COLUMN,
  Bague5: BAGUE5_COLUMN,
  Cale6: CALE6_COLUMN,
  Bague6: BAGUE6_COLUMN,
  Cale7: CALE7_COLUMN,
  Bague7: BAGUE7_COLUMN,
  LastUpdate: LAST_UPDATE_COLUMN,
};

export const RefenteColumns = {
  Ref: REFERENCE_COLUMN(70),
  RefPerfo: REF_PERFO_COLUMN,
  Decalage: DECALAGE_COLUMN,
  Laize1: LAIZE1_REFENTE_COLUMN,
  Laize2: LAIZE2_REFENTE_COLUMN,
  Laize3: LAIZE3_REFENTE_COLUMN,
  Laize4: LAIZE4_REFENTE_COLUMN,
  Laize5: LAIZE5_REFENTE_COLUMN,
  Laize6: LAIZE6_REFENTE_COLUMN,
  Laize7: LAIZE7_REFENTE_COLUMN,
  Chute: CHUTE_COLUMN,
  LastUpdate: LAST_UPDATE_COLUMN,
};

export const OperationColumns = {
  Ref: REFERENCE_COLUMN(40),
  Description: DESCRIPTION_COLUMN,
  Required: IS_REQUIRED_COLUMN,
  Constraint: OPERATION_CONSTRAINT_COLUMN,
  Duration: DURATION_SECONDS_COLUMN,
  LastUpdate: LAST_UPDATE_COLUMN,
};
// tslint:enable:no-magic-numbers
