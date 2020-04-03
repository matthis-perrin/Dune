import {isEqual, pick} from 'lodash-es';
import React from 'react';
import styled from 'styled-components';

import {AddPoseButtons} from '@root/components/common/add_pose_buttons';
import {BobineColors} from '@root/components/common/bobine_colors';
import {BobineState} from '@root/components/common/bobine_state';
import {Color} from '@root/components/common/color';
import {Duration} from '@root/components/common/duration';
import {
  OperationConstraint,
  ConstraintDescriptions,
} from '@root/components/common/operation_constraint';
import {RefLink} from '@root/components/common/ref_link';
import {Input} from '@root/components/core/input';
import {SVGIcon} from '@root/components/core/svg_icon';
import {ColumnMetadata} from '@root/components/table/sortable_table';
import {getBobineSellingPastYear, getBobineState, getBobineMonthlySelling} from '@root/lib/bobine';
import {bridge} from '@root/lib/bridge';
import {getProductionForBobine} from '@root/lib/plan_prod';
import {StockType, getStock, getStockTermePrevisionel} from '@root/lib/stocks';
import {numberWithSeparator} from '@root/lib/utils';
import {Colors, FontWeight} from '@root/theme';

import {dedupePoseNeutre} from '@shared/lib/bobines_filles';
import {BobineColors as BobineColorsModel} from '@shared/lib/encrier';
import {
  BobineFilleWithMultiPose,
  BobineQuantities,
  BobineState as BobineStateModel,
  Cliche,
  OperationConstraint as OperationConstraintModel,
  PlanProductionState,
  Stock,
  PlanProductionInfo,
  Schedule,
} from '@shared/models';

function getStocksSortFunction<T extends {ref: string}>(
  stocks: Map<string, Stock[]>,
  type: StockType
): (d1: T, d2: T) => number {
  return function(data1: T, data2: T): number {
    const s1 = getStock(data1.ref, stocks, type);
    const s2 = getStock(data2.ref, stocks, type);
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
  return <span>{value === undefined ? '-' : numberWithSeparator(value)}</span>;
}

function renderDate(value?: number): JSX.Element {
  return <span>{value ? new Date(value).toLocaleString('fr') : '-'}</span>;
}

function renderBoolean(value?: boolean): JSX.Element {
  return <span>{value === undefined ? '-' : value ? 'OUI' : 'NON'}</span>;
}

// tslint:disable:no-magic-numbers
export const REFERENCE_COLUMN = (width: number): ColumnMetadata<{ref: string}, string> => ({
  title: 'REFERENCE',
  width,
  renderCell: ({ref}) => renderString(ref),
  getSearchValue: row => row.ref,
  sortFunction: (row1, row2) => stringSort(row1.ref, row2.ref),
  shouldRerender: (row1, row2) => row1.ref !== row2.ref,
});

export const BOBINE_MERE_REF_COLUMN = REFERENCE_COLUMN(100);
export const REFENTE_REF_COLUMN = REFERENCE_COLUMN(70);
export const PERFO_REF_COLUMN = REFERENCE_COLUMN(70);
export const CLICHE_REF_COLUMN = REFERENCE_COLUMN(100);
export const OEPRATION_REF_COLUMN = REFERENCE_COLUMN(40);

export const BOBINE_FILLE_REF_COLUMN: ColumnMetadata<{ref: string}, string> = {
  title: 'REFERENCE',
  width: 190,
  renderCell: ({ref}) => (
    <RefLink
      onClick={() => bridge.viewBobine(ref).catch(console.error)}
      color={Colors.SecondaryDark}
    >
      {ref}
    </RefLink>
  ),
  getSearchValue: row => row.ref || '',
  sortFunction: (row1, row2) => optionalStringSort(row1.ref, row2.ref),
  shouldRerender: (row1, row2) => row1.ref !== row2.ref,
};

export const ID_COLUMN = (width: number): ColumnMetadata<{id: number}, number> => ({
  title: 'ID',
  width,
  renderCell: ({id}) => renderNumber(id),
  justifyContent: 'center',
  getSearchValue: row => String(row.id),
  sortFunction: (row1, row2) => numberSort(row1.id, row2.id),
  shouldRerender: (row1, row2) => row1.id !== row2.id,
});

export const DESIGNATION_COLUMN: ColumnMetadata<{designation?: string}, string> = {
  title: 'DESIGNATION',
  renderCell: ({designation}) => renderString(designation),
  getSearchValue: row => row.designation || '',
  sortFunction: (row1, row2) => optionalStringSort(row1.designation, row2.designation),
  shouldRerender: (row1, row2) => row1.designation !== row2.designation,
};

export const DESCRIPTION_COLUMN: ColumnMetadata<{description?: string}, string> = {
  title: 'DESCRIPTION',
  renderCell: ({description}) => renderString(description),
  getSearchValue: row => row.description || '',
  sortFunction: (row1, row2) => optionalStringSort(row1.description, row2.description),
  shouldRerender: (row1, row2) => row1.description !== row2.description,
};

export const LAIZE_COLUMN: ColumnMetadata<{laize?: number}, number> = {
  title: 'LAIZE',
  width: 64,
  renderCell: ({laize}) => renderNumber(laize),
  justifyContent: 'center',
  sortFunction: (row1, row2) => optionalNumberSort(row1.laize, row2.laize),
  filter: {
    getValue: (row: {laize?: number}) => row.laize || 0,
  },
  shouldRerender: (row1, row2) => row1.laize !== row2.laize,
};

export const PISTES_COLUMN: ColumnMetadata<{pistes: number}, number> = {
  title: 'PISTES',
  width: 55,
  renderCell: ({pistes}) => renderNumber(pistes),
  justifyContent: 'center',
  sortFunction: (row1, row2) => numberSort(row1.pistes, row2.pistes),
  shouldRerender: (row1, row2) => row1.pistes !== row2.pistes,
};

export const LONGUEUR_COLUMN: ColumnMetadata<{longueurDesignation?: number}, number> = {
  title: 'LONG',
  width: 64,
  renderCell: ({longueurDesignation}) => renderNumber(longueurDesignation),
  justifyContent: 'center',
  sortFunction: (row1, row2) =>
    optionalNumberSort(row1.longueurDesignation, row2.longueurDesignation),
  filter: {
    getValue: (row: {longueurDesignation?: number}) => row.longueurDesignation || 0,
  },
  shouldRerender: (row1, row2) => row1.longueurDesignation !== row2.longueurDesignation,
};

export const REAL_LONGUEUR_COLUMN: ColumnMetadata<{longueur?: number}, number> = {
  title: 'LONG',
  width: 64,
  renderCell: ({longueur}) => renderNumber(longueur),
  justifyContent: 'center',
  sortFunction: (row1, row2) => optionalNumberSort(row1.longueur, row2.longueur),
  filter: {
    getValue: (row: {longueur?: number}) => row.longueur || 0,
  },
  shouldRerender: (row1, row2) => row1.longueur !== row2.longueur,
};

export const COULEUR_PAPIER_COLUMN: ColumnMetadata<{couleurPapier?: string}, string> = {
  title: 'COULEUR',
  width: 100,
  renderCell: ({couleurPapier}) =>
    couleurPapier ? <Color color={couleurPapier} /> : <React.Fragment />,
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
  title: 'COULEURS CLICHÉS',
  width: 240,
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
  shouldRerender: (row1, row2) => !isEqual(row1.colors, row2.colors),
};

export const GRAMMAGE_COLUMN: ColumnMetadata<{grammage?: number}, number> = {
  title: 'GR',
  width: 55,
  renderCell: ({grammage}) => renderNumber(grammage),
  justifyContent: 'center',
  sortFunction: (row1, row2) => optionalNumberSort(row1.grammage, row2.grammage),
  filter: {
    getValue: (row: {grammage?: number}) => row.grammage || 0,
  },
  shouldRerender: (row1, row2) => row1.grammage !== row2.grammage,
};

export const GRAMMAGE_M2_COLUMN: ColumnMetadata<{grammage?: number}, number> = {
  title: 'G/M²',
  width: 55,
  renderCell: ({grammage}) => renderNumber(grammage),
  justifyContent: 'center',
  sortFunction: (row1, row2) => optionalNumberSort(row1.grammage, row2.grammage),
  filter: {
    getValue: (row: {grammage?: number}) => row.grammage || 0,
  },
  shouldRerender: (row1, row2) => row1.grammage !== row2.grammage,
};

const STOCK_COLUMN = (
  title: string,
  type: StockType,
  stocks: Map<string, Stock[]>,
  width: number = 65
): ColumnMetadata<{ref: string}, number> => ({
  title,
  width,
  renderCell: row => {
    const stock = getStock(row.ref, stocks, type);
    const color = stock < 0 ? Colors.Danger : undefined;
    const fontWeight = stock < 0 ? FontWeight.Bold : undefined;
    return <span style={{color, fontWeight}}>{renderNumber(stock)}</span>;
  },
  justifyContent: 'center',
  sortFunction: getStocksSortFunction(stocks, type),
  shouldRerender: (row1, row2) => row1.ref !== row2.ref,
});

export const STOCK_TERME_COLUMN = (stocks: Map<string, Stock[]>) =>
  STOCK_COLUMN('STOCKS TERME', StockType.TERME, stocks);

export const STOCK_REEL_COLUMN = (stocks: Map<string, Stock[]>) =>
  STOCK_COLUMN('STOCKS RÉEL', StockType.REEL, stocks);

export const STOCK_COMMANDE_COLUMN = (stocks: Map<string, Stock[]>) =>
  STOCK_COLUMN('STOCKS COMMANDÉ', StockType.COMMANDE, stocks, 85);

export const STOCK_RESERVE_COLUMN = (stocks: Map<string, Stock[]>) =>
  STOCK_COLUMN('STOCKS RÉSERVÉ', StockType.RESERVE, stocks, 75);

export const STOCK_PREVISIONEL_COMPUTED_COLUMN = (
  stocks: Map<string, Stock[]>,
  schedule: Schedule,
  planProd: PlanProductionState & PlanProductionInfo
): ColumnMetadata<{ref: string; start: number}, number> => ({
  title: 'STOCK PRÉVISIONEL',
  width: 65,
  renderCell: ({ref, start}) => {
    const stock =
      getStockTermePrevisionel(ref, stocks, schedule, start) +
      getProductionForBobine(ref, planProd);
    const color = stock < 0 ? Colors.Danger : undefined;
    const fontWeight = stock < 0 ? FontWeight.Bold : undefined;
    return <span style={{color, fontWeight}}>{renderNumber(stock)}</span>;
  },
  justifyContent: 'center',
  sortFunction: (row1, row2) => {
    const stock1 =
      getStockTermePrevisionel(row1.ref, stocks, schedule, row1.start) +
      getProductionForBobine(row1.ref, planProd);
    const stock2 =
      getStockTermePrevisionel(row2.ref, stocks, schedule, row2.start) +
      getProductionForBobine(row2.ref, planProd);
    return stock1 - stock2;
  },
  shouldRerender: (prev, next) => {
    const stock1 =
      getStockTermePrevisionel(prev.ref, stocks, schedule, prev.start) +
      getProductionForBobine(prev.ref, planProd);
    const stock2 =
      getStockTermePrevisionel(next.ref, stocks, schedule, next.start) +
      getProductionForBobine(next.ref, planProd);
    return stock1 !== stock2;
  },
});

export const TYPE_IMPRESSION_COLUMN: ColumnMetadata<{typeImpression?: string}, string> = {
  title: 'IMP',
  width: 64,
  renderCell: ({typeImpression}) => renderString(typeImpression),
  getSearchValue: row => row.typeImpression || '-',
  sortFunction: (row1, row2) => optionalStringSort(row1.typeImpression, row2.typeImpression),
  shouldRerender: (row1, row2) => row1.typeImpression !== row2.typeImpression,
  filter: {
    getValue: ({typeImpression}) => typeImpression || '-',
  },
};

export const REF_CLICHE1_COLUMN: ColumnMetadata<{refCliche1?: string}, string> = {
  title: 'REF CLICHÉ 1',
  width: 95,
  renderCell: ({refCliche1}) => renderString(refCliche1),
  getSearchValue: row => row.refCliche1 || '',
  sortFunction: (row1, row2) => optionalStringSort(row1.refCliche1, row2.refCliche1),
  shouldRerender: (row1, row2) => row1.refCliche1 !== row2.refCliche1,
};

export const REF_CLICHE2_COLUMN: ColumnMetadata<{refCliche2?: string}, string> = {
  title: 'REF CLICHÉ 2',
  width: 95,
  renderCell: ({refCliche2}) => renderString(refCliche2),
  getSearchValue: row => row.refCliche2 || '',
  sortFunction: (row1, row2) => optionalStringSort(row1.refCliche2, row2.refCliche2),
  shouldRerender: (row1, row2) => row1.refCliche2 !== row2.refCliche2,
};

export const COULEUR1_CLICHE_COLUMN: ColumnMetadata<{couleur1?: string}, string> = {
  title: 'COULEUR 1',
  width: 110,
  renderCell: ({couleur1}) => (couleur1 ? <Color color={couleur1} /> : renderString(couleur1)),
  getSearchValue: row => row.couleur1 || '',
  sortFunction: (row1, row2) => optionalStringSort(row1.couleur1, row2.couleur1),
  filter: {
    getValue: ({couleur1}) => couleur1 || '',
  },
  shouldRerender: (row1, row2) => row1.couleur1 !== row2.couleur1,
};

export const COULEUR2_CLICHE_COLUMN: ColumnMetadata<{couleur2?: string}, string> = {
  title: 'COULEUR 2',
  width: 110,
  renderCell: ({couleur2}) => (couleur2 ? <Color color={couleur2} /> : renderString(couleur2)),
  getSearchValue: row => row.couleur2 || '',
  sortFunction: (row1, row2) => optionalStringSort(row1.couleur2, row2.couleur2),
  filter: {
    getValue: ({couleur2}) => couleur2 || '',
  },
  shouldRerender: (row1, row2) => row1.couleur2 !== row2.couleur2,
};

export const COULEUR3_CLICHE_COLUMN: ColumnMetadata<{couleur3?: string}, string> = {
  title: 'COULEUR 3',
  width: 110,
  renderCell: ({couleur3}) => (couleur3 ? <Color color={couleur3} /> : renderString(couleur3)),
  getSearchValue: row => row.couleur3 || '',
  sortFunction: (row1, row2) => optionalStringSort(row1.couleur3, row2.couleur3),
  filter: {
    getValue: ({couleur3}) => couleur3 || '',
  },
  shouldRerender: (row1, row2) => row1.couleur3 !== row2.couleur3,
};

export const IMPORTANCE_ORDRE_COULEUR_COLUMN: ColumnMetadata<
  {importanceOrdreCouleurs?: boolean},
  boolean
> = {
  title: 'COULEURS ORDONNÉES',
  width: 120,
  renderCell: ({importanceOrdreCouleurs}) => renderBoolean(importanceOrdreCouleurs),
  sortFunction: (row1, row2) =>
    optionalBooleanSort(row1.importanceOrdreCouleurs, row2.importanceOrdreCouleurs),
  filter: {
    getValue: (row: {importanceOrdreCouleurs: boolean}) => row.importanceOrdreCouleurs,
  },
  shouldRerender: (row1, row2) => row1.importanceOrdreCouleurs !== row2.importanceOrdreCouleurs,
};

export const IS_REQUIRED_COLUMN: ColumnMetadata<{required?: boolean}, boolean> = {
  title: 'OBLIGATOIRE',
  width: 110,
  renderCell: ({required}) => renderBoolean(required),
  sortFunction: (row1, row2) => optionalBooleanSort(row1.required, row2.required),
  filter: {
    getValue: (row: {required: boolean}) => row.required,
  },
  shouldRerender: (row1, row2) => row1.required !== row2.required,
};

export const LAST_UPDATE_COLUMN: ColumnMetadata<{localUpdate: number}, number> = {
  title: 'DATE MODIFICATION',
  width: 170,
  renderCell: ({localUpdate}) => renderDate(localUpdate),
  sortFunction: (row1, row2) => numberSort(row1.localUpdate, row2.localUpdate),
  shouldRerender: (row1, row2) => {
    return row1.localUpdate !== row2.localUpdate;
  },
};

export const LAIZE1_REFENTE_COLUMN: ColumnMetadata<{laize1?: number}, number> = {
  title: 'LAIZE 1',
  renderCell: ({laize1}) => renderNumber(laize1),
  justifyContent: 'center',
  sortFunction: (row1, row2) => optionalNumberSort(row1.laize1, row2.laize1),
  filter: {
    getValue: (row: {laize1?: number}) => row.laize1 || 0,
  },
  shouldRerender: (row1, row2) => row1.laize1 !== row2.laize1,
};

export const LAIZE2_REFENTE_COLUMN: ColumnMetadata<{laize2?: number}, number> = {
  title: 'LAIZE 2',
  renderCell: ({laize2}) => renderNumber(laize2),
  justifyContent: 'center',
  sortFunction: (row1, row2) => optionalNumberSort(row1.laize2, row2.laize2),
  filter: {
    getValue: (row: {laize2?: number}) => row.laize2 || 0,
  },
  shouldRerender: (row1, row2) => row1.laize2 !== row2.laize2,
};

export const LAIZE3_REFENTE_COLUMN: ColumnMetadata<{laize3?: number}, number> = {
  title: 'LAIZE 3',
  renderCell: ({laize3}) => renderNumber(laize3),
  justifyContent: 'center',
  sortFunction: (row1, row2) => optionalNumberSort(row1.laize3, row2.laize3),
  filter: {
    getValue: (row: {laize3?: number}) => row.laize3 || 0,
  },
  shouldRerender: (row1, row2) => row1.laize3 !== row2.laize3,
};

export const LAIZE4_REFENTE_COLUMN: ColumnMetadata<{laize4?: number}, number> = {
  title: 'LAIZE 4',
  renderCell: ({laize4}) => renderNumber(laize4),
  justifyContent: 'center',
  sortFunction: (row1, row2) => optionalNumberSort(row1.laize4, row2.laize4),
  filter: {
    getValue: (row: {laize4?: number}) => row.laize4 || 0,
  },
  shouldRerender: (row1, row2) => row1.laize4 !== row2.laize4,
};

export const LAIZE5_REFENTE_COLUMN: ColumnMetadata<{laize5?: number}, number> = {
  title: 'LAIZE 5',
  renderCell: ({laize5}) => renderNumber(laize5),
  justifyContent: 'center',
  sortFunction: (row1, row2) => optionalNumberSort(row1.laize5, row2.laize5),
  filter: {
    getValue: (row: {laize5?: number}) => row.laize5 || 0,
  },
  shouldRerender: (row1, row2) => row1.laize5 !== row2.laize5,
};

export const LAIZE6_REFENTE_COLUMN: ColumnMetadata<{laize6?: number}, number> = {
  title: 'LAIZE 6',
  renderCell: ({laize6}) => renderNumber(laize6),
  justifyContent: 'center',
  sortFunction: (row1, row2) => optionalNumberSort(row1.laize6, row2.laize6),
  filter: {
    getValue: (row: {laize6?: number}) => row.laize6 || 0,
  },
  shouldRerender: (row1, row2) => row1.laize6 !== row2.laize6,
};

export const LAIZE7_REFENTE_COLUMN: ColumnMetadata<{laize7?: number}, number> = {
  title: 'LAIZE 7',
  renderCell: ({laize7}) => renderNumber(laize7),
  justifyContent: 'center',
  sortFunction: (row1, row2) => optionalNumberSort(row1.laize7, row2.laize7),
  filter: {
    getValue: (row: {laize7?: number}) => row.laize7 || 0,
  },
  shouldRerender: (row1, row2) => row1.laize7 !== row2.laize7,
};

export const NOMBRE_POSES_COLUMN: ColumnMetadata<Cliche, Cliche> = {
  title: 'POSES',
  width: 120,
  sortFunction: sortClichesPosesFunction,
  renderCell: (cliche: Cliche) => <span>{`[${getPoses(cliche).join(', ')}]`}</span>,
  shouldRerender: (row1, row2) => row1.ref !== row2.ref,
};

export const POSE_COLUMN: ColumnMetadata<{pose?: number}, number> = {
  title: 'POSE',
  width: 55,
  renderCell: ({pose}) => renderNumber(pose),
  justifyContent: 'center',
  sortFunction: (row1, row2) => optionalNumberSort(row1.pose, row2.pose),
  filter: {
    getValue: (row: {pose: number}) => row.pose,
  },
  shouldRerender: (row1, row2) => row1.pose !== row2.pose,
};

export const MULTI_POSE_COLUMN = (
  id: number,
  stocks: Map<string, Stock[]>,
  cadencier: Map<string, Map<number, number>>,
  bobineQuantities: BobineQuantities[],
  schedule: Schedule,
  planProd: PlanProductionState & PlanProductionInfo
): ColumnMetadata<BobineFilleWithMultiPose, string> => {
  return {
    title: 'POSES',
    width: 180,
    renderCell: bobine => (
      <AddPoseButtons
        id={id}
        bobine={bobine}
        stocks={stocks}
        cadencier={cadencier}
        bobineQuantities={bobineQuantities}
        planProd={planProd}
        schedule={schedule}
        planInfo={planProd}
      />
    ),
    sortFunction: (row1, row2) =>
      sortArrayFunction(
        dedupePoseNeutre(row1.availablePoses),
        dedupePoseNeutre(row2.availablePoses),
        true,
        numberSort
      ),
    shouldRerender: (row1, row2) => !isEqual(row1.availablePoses, row2.availablePoses),
  };
};

export const DECALAGE_INITIAL_COLUMN: ColumnMetadata<{decalageInitial?: number}, number> = {
  title: 'DÉCALAGE',
  width: 55,
  renderCell: ({decalageInitial}) => renderNumber(decalageInitial),
  justifyContent: 'center',
  sortFunction: (row1, row2) => optionalNumberSort(row1.decalageInitial, row2.decalageInitial),
  filter: {
    getValue: (row: {decalageInitial: number}) => row.decalageInitial,
  },
  shouldRerender: (row1, row2) => row1.decalageInitial !== row2.decalageInitial,
};

export const CALE1_COLUMN: ColumnMetadata<{cale1?: number}, number> = {
  title: 'CALE 1',
  width: 55,
  renderCell: ({cale1}) => renderNumber(cale1),
  justifyContent: 'center',
  sortFunction: (row1, row2) => optionalNumberSort(row1.cale1, row2.cale1),
  filter: {
    getValue: (row: {cale1?: number}) => row.cale1 || 0,
  },
  shouldRerender: (row1, row2) => row1.cale1 !== row2.cale1,
};

export const CALE2_COLUMN: ColumnMetadata<{cale2?: number}, number> = {
  title: 'CALE 2',
  width: 55,
  renderCell: ({cale2}) => renderNumber(cale2),
  justifyContent: 'center',
  sortFunction: (row1, row2) => optionalNumberSort(row1.cale2, row2.cale2),
  filter: {
    getValue: (row: {cale2?: number}) => row.cale2 || 0,
  },
  shouldRerender: (row1, row2) => row1.cale2 !== row2.cale2,
};

export const CALE3_COLUMN: ColumnMetadata<{cale3?: number}, number> = {
  title: 'CALE 3',
  width: 55,
  renderCell: ({cale3}) => renderNumber(cale3),
  justifyContent: 'center',
  sortFunction: (row1, row2) => optionalNumberSort(row1.cale3, row2.cale3),
  filter: {
    getValue: (row: {cale3?: number}) => row.cale3 || 0,
  },
  shouldRerender: (row1, row2) => row1.cale3 !== row2.cale3,
};

export const CALE4_COLUMN: ColumnMetadata<{cale4?: number}, number> = {
  title: 'CALE 4',
  width: 55,
  renderCell: ({cale4}) => renderNumber(cale4),
  justifyContent: 'center',
  sortFunction: (row1, row2) => optionalNumberSort(row1.cale4, row2.cale4),
  filter: {
    getValue: (row: {cale4?: number}) => row.cale4 || 0,
  },
  shouldRerender: (row1, row2) => row1.cale4 !== row2.cale4,
};

export const CALE5_COLUMN: ColumnMetadata<{cale5?: number}, number> = {
  title: 'CALE 5',
  width: 55,
  renderCell: ({cale5}) => renderNumber(cale5),
  justifyContent: 'center',
  sortFunction: (row1, row2) => optionalNumberSort(row1.cale5, row2.cale5),
  filter: {
    getValue: (row: {cale5?: number}) => row.cale5 || 0,
  },
  shouldRerender: (row1, row2) => row1.cale5 !== row2.cale5,
};

export const CALE6_COLUMN: ColumnMetadata<{cale6?: number}, number> = {
  title: 'CALE 6',
  width: 55,
  renderCell: ({cale6}) => renderNumber(cale6),
  justifyContent: 'center',
  sortFunction: (row1, row2) => optionalNumberSort(row1.cale6, row2.cale6),
  filter: {
    getValue: (row: {cale6?: number}) => row.cale6 || 0,
  },
  shouldRerender: (row1, row2) => row1.cale6 !== row2.cale6,
};

export const CALE7_COLUMN: ColumnMetadata<{cale7?: number}, number> = {
  title: 'CALE 7',
  width: 55,
  renderCell: ({cale7}) => renderNumber(cale7),
  justifyContent: 'center',
  sortFunction: (row1, row2) => optionalNumberSort(row1.cale7, row2.cale7),
  filter: {
    getValue: (row: {cale7?: number}) => row.cale7 || 0,
  },
  shouldRerender: (row1, row2) => row1.cale7 !== row2.cale7,
};

export const BAGUE1_COLUMN: ColumnMetadata<{bague1?: number}, number> = {
  title: 'BAGUE 1',
  renderCell: ({bague1}) => renderNumber(bague1),
  justifyContent: 'center',
  sortFunction: (row1, row2) => optionalNumberSort(row1.bague1, row2.bague1),
  filter: {
    getValue: (row: {bague1?: number}) => row.bague1 || 0,
  },
  shouldRerender: (row1, row2) => row1.bague1 !== row2.bague1,
};

export const BAGUE2_COLUMN: ColumnMetadata<{bague2?: number}, number> = {
  title: 'BAGUE 2',
  renderCell: ({bague2}) => renderNumber(bague2),
  justifyContent: 'center',
  sortFunction: (row1, row2) => optionalNumberSort(row1.bague2, row2.bague2),
  filter: {
    getValue: (row: {bague2?: number}) => row.bague2 || 0,
  },
  shouldRerender: (row1, row2) => row1.bague2 !== row2.bague2,
};

export const BAGUE3_COLUMN: ColumnMetadata<{bague3?: number}, number> = {
  title: 'BAGUE 3',
  renderCell: ({bague3}) => renderNumber(bague3),
  justifyContent: 'center',
  sortFunction: (row1, row2) => optionalNumberSort(row1.bague3, row2.bague3),
  filter: {
    getValue: (row: {bague3?: number}) => row.bague3 || 0,
  },
  shouldRerender: (row1, row2) => row1.bague3 !== row2.bague3,
};

export const BAGUE4_COLUMN: ColumnMetadata<{bague4?: number}, number> = {
  title: 'BAGUE 4',
  renderCell: ({bague4}) => renderNumber(bague4),
  justifyContent: 'center',
  sortFunction: (row1, row2) => optionalNumberSort(row1.bague4, row2.bague4),
  filter: {
    getValue: (row: {bague4?: number}) => row.bague4 || 0,
  },
  shouldRerender: (row1, row2) => row1.bague4 !== row2.bague4,
};

export const BAGUE5_COLUMN: ColumnMetadata<{bague5?: number}, number> = {
  title: 'BAGUE 5',
  renderCell: ({bague5}) => renderNumber(bague5),
  justifyContent: 'center',
  sortFunction: (row1, row2) => optionalNumberSort(row1.bague5, row2.bague5),
  filter: {
    getValue: (row: {bague5?: number}) => row.bague5 || 0,
  },
  shouldRerender: (row1, row2) => row1.bague5 !== row2.bague5,
};

export const BAGUE6_COLUMN: ColumnMetadata<{bague6?: number}, number> = {
  title: 'BAGUE 6',
  renderCell: ({bague6}) => renderNumber(bague6),
  justifyContent: 'center',
  sortFunction: (row1, row2) => optionalNumberSort(row1.bague6, row2.bague6),
  filter: {
    getValue: (row: {bague6?: number}) => row.bague6 || 0,
  },
  shouldRerender: (row1, row2) => row1.bague6 !== row2.bague6,
};

export const BAGUE7_COLUMN: ColumnMetadata<{bague7?: number}, number> = {
  title: 'BAGUE 7',
  renderCell: ({bague7}) => renderNumber(bague7),
  justifyContent: 'center',
  sortFunction: (row1, row2) => optionalNumberSort(row1.bague7, row2.bague7),
  filter: {
    getValue: (row: {bague7?: number}) => row.bague7 || 0,
  },
  shouldRerender: (row1, row2) => row1.bague7 !== row2.bague7,
};

export const REF_PERFO_COLUMN: ColumnMetadata<{refPerfo: string}, string> = {
  title: 'REF PERFO',
  width: 70,
  renderCell: ({refPerfo}) => renderString(refPerfo),
  getSearchValue: row => row.refPerfo || '',
  sortFunction: (row1, row2) => optionalStringSort(row1.refPerfo, row2.refPerfo),
  shouldRerender: (row1, row2) => row1.refPerfo !== row2.refPerfo,
};

export const DECALAGE_COLUMN: ColumnMetadata<{decalage?: number}, number> = {
  title: 'DÉCALAGE',
  width: 55,
  renderCell: ({decalage}) => renderNumber(decalage),
  justifyContent: 'center',
  sortFunction: (row1, row2) => optionalNumberSort(row1.decalage, row2.decalage),
  filter: {
    getValue: (row: {decalage: number}) => row.decalage,
  },
  shouldRerender: (row1, row2) => row1.decalage !== row2.decalage,
};

export const CHUTE_COLUMN: ColumnMetadata<{chute?: number}, number> = {
  title: 'CHUTE',
  width: 80,
  renderCell: ({chute}) => renderNumber(chute),
  justifyContent: 'center',
  sortFunction: (row1, row2) => optionalNumberSort(row1.chute, row2.chute),
  filter: {
    getValue: (row: {chute: number}) => row.chute,
  },
  shouldRerender: (row1, row2) => row1.chute !== row2.chute,
};

export const DURATION_SECONDS_COLUMN: ColumnMetadata<{duration: number}, string> = {
  title: 'TEMPS',
  width: 90,
  renderCell: ({duration}) => <Duration durationMs={duration} />,
  sortFunction: (row1, row2) => numberSort(row1.duration, row2.duration),
  shouldRerender: (row1, row2) => row1.duration !== row2.duration,
};

export const LAST_YEAR_SELLING = (
  cadencier: Map<string, Map<number, number>>
): ColumnMetadata<{ref: string}, number> => ({
  title: 'VENTES 12M',
  width: 65,
  renderCell: ({ref}) => renderNumber(getBobineSellingPastYear(cadencier.get(ref))),
  justifyContent: 'center',
  sortFunction: (row1, row2) =>
    numberSort(
      getBobineSellingPastYear(cadencier.get(row1.ref)),
      getBobineSellingPastYear(cadencier.get(row2.ref))
    ),
  shouldRerender: (row1, row2) =>
    getBobineSellingPastYear(cadencier.get(row1.ref)) !==
    getBobineSellingPastYear(cadencier.get(row2.ref)),
});

export const MONTHLY_SELLING = (
  cadencier: Map<string, Map<number, number>>
): ColumnMetadata<{ref: string}, number> => ({
  title: 'VENTES 1M',
  width: 65,
  renderCell: ({ref}) => renderNumber(getBobineMonthlySelling(cadencier.get(ref))),
  justifyContent: 'center',
  sortFunction: (row1, row2) =>
    numberSort(
      getBobineMonthlySelling(cadencier.get(row1.ref)),
      getBobineMonthlySelling(cadencier.get(row2.ref))
    ),
  shouldRerender: (row1, row2) =>
    getBobineMonthlySelling(cadencier.get(row1.ref)) !==
    getBobineMonthlySelling(cadencier.get(row2.ref)),
});

export const STOCK_STATE_COLUMN = (
  stocks: Map<string, Stock[]>,
  cadencier: Map<string, Map<number, number>>,
  bobineQuantities: BobineQuantities[],
  schedule: Schedule,
  planProd: PlanProductionState & PlanProductionInfo
): ColumnMetadata<{ref: string; start: number}, number> => ({
  title: 'ETAT',
  width: 152,
  renderCell: ({ref, start}) => {
    const prod = getProductionForBobine(ref, planProd);
    const {state, info} = getBobineState(
      ref,
      stocks,
      cadencier,
      bobineQuantities,
      prod,
      schedule,
      start
    );
    return <BobineState state={state} info={info} />;
  },
  justifyContent: 'flex-end',
  sortFunction: (row1, row2) => {
    const prod1 = getProductionForBobine(row1.ref, planProd);
    const prod2 = getProductionForBobine(row2.ref, planProd);
    const info1 = getBobineState(
      row1.ref,
      stocks,
      cadencier,
      bobineQuantities,
      prod1,
      schedule,
      row1.start
    );
    const info2 = getBobineState(
      row2.ref,
      stocks,
      cadencier,
      bobineQuantities,
      prod2,
      schedule,
      row2.start
    );
    if (info1.state === info2.state) {
      return info1.infoValue - info2.infoValue;
    }
    return info1.state - info2.state;
  },
  shouldRerender: (row1, row2) => {
    const prod1 = getProductionForBobine(row1.ref, planProd);
    const prod2 = getProductionForBobine(row2.ref, planProd);
    return (
      getBobineState(row1.ref, stocks, cadencier, bobineQuantities, prod1, schedule, row1.start)
        .state !==
      getBobineState(row2.ref, stocks, cadencier, bobineQuantities, prod2, schedule, row2.start)
        .state
    );
  },
  filter: {
    getValue: ({ref, start}) =>
      getBobineState(
        ref,
        stocks,
        cadencier,
        bobineQuantities,
        getProductionForBobine(ref, planProd),
        schedule,
        start
      ).state,
    render: (row, value) => <BobineState state={value} />,
  },
});

export const QUANTITY_TO_PRODUCE = (
  stocks: Map<string, Stock[]>,
  cadencier: Map<string, Map<number, number>>,
  bobineQuantities: BobineQuantities[],
  schedule: Schedule,
  planInfo: PlanProductionInfo
): ColumnMetadata<{ref: string; start: number}, number> => ({
  title: 'QTÉ À PROD',
  width: 65,
  renderCell: ({ref, start}) =>
    renderNumber(
      getBobineState(ref, stocks, cadencier, bobineQuantities, 0, schedule, start).quantity
    ),
  justifyContent: 'center',
  sortFunction: (row1, row2) =>
    numberSort(
      getBobineState(row1.ref, stocks, cadencier, bobineQuantities, 0, schedule, row1.start)
        .quantity,
      getBobineState(row2.ref, stocks, cadencier, bobineQuantities, 0, schedule, row2.start)
        .quantity
    ),
  shouldRerender: (row1, row2) =>
    getBobineState(row1.ref, stocks, cadencier, bobineQuantities, 0, schedule, row1.start)
      .quantity !==
    getBobineState(row2.ref, stocks, cadencier, bobineQuantities, 0, schedule, row2.start).quantity,
});

export const PRODUCTION_COLUMN: ColumnMetadata<{production: number}, number> = {
  title: 'PROD',
  width: 65,
  renderCell: ({production}) => (
    <span style={{fontWeight: FontWeight.Bold, fontSize: 16}}>{`+${numberWithSeparator(
      production
    )}`}</span>
  ),
  justifyContent: 'center',
  sortFunction: (row1, row2) => numberSort(row1.production, row2.production),
  shouldRerender: (row1, row2) => row1.production !== row2.production,
};

export const STOCK_ACTUEL_COLUMN: ColumnMetadata<{stock: number}, number> = {
  title: 'STOCK ACTUEL',
  width: 65,
  renderCell: ({stock}) => renderNumber(stock),
  justifyContent: 'center',
  sortFunction: (row1, row2) => numberSort(row1.stock, row2.stock),
  shouldRerender: (row1, row2) => row1.stock !== row2.stock,
};

export const STATE_ACTUEL_COLUMN: ColumnMetadata<
  {state: BobineStateModel; info: string},
  number
> = {
  title: 'ÉTAT ACTUEL',
  width: 152,
  renderCell: ({state, info}) => <BobineState state={state} info={info} />,
  justifyContent: 'flex-end',
  sortFunction: (row1, row2) => numberSort(row1.state, row2.state),
  shouldRerender: (row1, row2) => row1.state !== row2.state,
};

export const QUANTITY_COLUMN: ColumnMetadata<{quantity: number}, number> = {
  title: 'QTÉ À PROD',
  width: 65,
  renderCell: ({quantity}) => renderNumber(quantity),
  justifyContent: 'center',
  sortFunction: (row1, row2) => numberSort(row1.quantity, row2.quantity),
  shouldRerender: (row1, row2) => row1.quantity !== row2.quantity,
};

export const STOCK_PREVISIONEL_COLUMN: ColumnMetadata<{newStock: number}, number> = {
  title: 'STOCK PRÉVISIONNEL',
  width: 100,
  renderCell: ({newStock}) => renderNumber(newStock),
  justifyContent: 'center',
  sortFunction: (row1, row2) => numberSort(row1.newStock, row2.newStock),
  shouldRerender: (row1, row2) => row1.newStock !== row2.newStock,
};

export const STATE_PREVISIONEL_COLUMN: ColumnMetadata<
  {newState: BobineStateModel; newInfo: string},
  number
> = {
  title: 'ÉTAT PRÉVISIONNEL',
  width: 152,
  renderCell: ({newState, newInfo}) => <BobineState state={newState} info={newInfo} />,
  justifyContent: 'flex-end',
  sortFunction: (row1, row2) => numberSort(row1.newState, row2.newState),
  shouldRerender: (row1, row2) => row1.newState !== row2.newState,
};

export const OPERATION_DESCRIPTION_COLUMN: ColumnMetadata<{description: string}, string> = {
  title: 'OPÉRATION',
  renderCell: ({description}) => renderString(description),
  sortFunction: (row1, row2) => stringSort(row1.description, row2.description),
  shouldRerender: (row1, row2) => row1.description !== row2.description,
};

export const OPERATION_DURATION_COLUMN: ColumnMetadata<{duration: number}, number> = {
  title: 'DURÉE',
  width: 50,
  renderCell: ({duration}) => renderNumber(duration / 60),
  justifyContent: 'center',
  sortFunction: (row1, row2) => numberSort(row1.duration, row2.duration),
  shouldRerender: (row1, row2) => row1.duration !== row2.duration,
};

export const OPERATION_CONSTRAINT_COLUMN: ColumnMetadata<
  {constraint: OperationConstraintModel},
  string
> = {
  title: 'CONTRAINTE',
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

export const OPERATION_QUANTITY_COLUMN: ColumnMetadata<{count: number}, number> = {
  title: 'QTÉ',
  width: 40,
  renderCell: ({count}) => renderNumber(count),
  justifyContent: 'center',
  sortFunction: (row1, row2) => numberSort(row1.count, row2.count),
  shouldRerender: (row1, row2) => row1.count !== row2.count,
};

export const OPERATION_DURATION_TOTAL_COLUMN: ColumnMetadata<{durationTotal: number}, number> = {
  title: 'TOTAL',
  width: 50,
  renderCell: ({durationTotal}) => renderNumber(durationTotal / 60),
  justifyContent: 'center',
  sortFunction: (row1, row2) => numberSort(row1.durationTotal, row2.durationTotal),
  shouldRerender: (row1, row2) => row1.durationTotal !== row2.durationTotal,
};

const CloseButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  cursor: pointer;
  fill: ${Colors.Danger};
  opacity: 0.5;
  :hover {
    opacity: 1;
  }
`;

export function CLOSE_COLUMN<T>(onClose: (row: T) => void): ColumnMetadata<T, void> {
  return {
    title: '',
    width: 30,
    renderCell: row => (
      <CloseButton onClick={() => onClose(row)}>
        <SVGIcon name="cross" width={12} height={12} />
      </CloseButton>
    ),
    justifyContent: 'flex-end',
    shouldRerender: (row1, row2) => row1 !== row2,
  };
}

export function MINIMUM_COLUMN<T extends {ref: string; minimum: number}>(
  onMinimumUpdated: (ref: string, newMinimum: number) => void
): ColumnMetadata<T, void> {
  return {
    title: 'MINI',
    width: 50,
    renderCell: row => (
      <Input
        style={{padding: 4, textAlign: 'center', height: 26, lineHeight: 26}}
        value={row.minimum}
        onChange={event => onMinimumUpdated(row.ref, parseFloat(event.target.value))}
      />
    ),
    justifyContent: 'center',
    shouldRerender: (row1, row2) => row1 !== row2,
  };
}

export function MAXIMUM_COLUMN<T extends {ref: string; maximum: number}>(
  onMaximumUpdated: (ref: string, newMinimum: number) => void
): ColumnMetadata<T, void> {
  return {
    title: 'MAX',
    width: 50,
    renderCell: row => (
      <Input
        style={{padding: 4, textAlign: 'center', height: 26, lineHeight: 26}}
        value={row.maximum || ''}
        onChange={event => onMaximumUpdated(row.ref, parseFloat(event.target.value))}
      />
    ),
    justifyContent: 'center',
    shouldRerender: (row1, row2) => row1 !== row2,
  };
}
// tslint:enable:no-magic-numbers

export function toStaticColumn<T, U>(column: ColumnMetadata<T, U>): ColumnMetadata<T, U> {
  return pick(column, ['title', 'renderCell', 'shouldRerender', 'width', 'justifyContent']);
}

export function withWidth<T, U>(
  column: ColumnMetadata<T, U>,
  width: number | undefined
): ColumnMetadata<T, U> {
  return {...column, width};
}
