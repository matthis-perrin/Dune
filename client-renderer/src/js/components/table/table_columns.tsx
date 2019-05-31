import {
  BobineFilleColumns,
  BobineMereColumns,
  ClicheColumns,
  OperationColumns,
  PerfoColumns,
  RefenteColumns,
  BobineFilleClichePoseColumns,
} from '@root/components/table/columns';
import {ColumnMetadata} from '@root/components/table/sortable_table';
import {BobineFilleClichePose} from '@root/lib/plan_production/model';

import {BobineFille, BobineMere, Cliche, Perfo, Refente, Stock, Operation} from '@shared/models';

// tslint:disable-next-line:no-any
type AnyColumnMetadata<T> = ColumnMetadata<T, any>;

export function getBobineFilleColumns(stocks: {
  [key: string]: Stock[];
}): AnyColumnMetadata<BobineFille>[] {
  return [
    BobineFilleColumns.Ref,
    BobineFilleColumns.Designation,
    BobineFilleColumns.Laize,
    BobineFilleColumns.Longueur,
    BobineFilleColumns.CouleurPapier,
    BobineFilleColumns.Grammage,
    BobineFilleColumns.TypeImpression,
    BobineFilleColumns.RefCliche1,
    BobineFilleColumns.RefCliche2,
    BobineFilleColumns.Stock(stocks),
    BobineFilleColumns.LastUpdate,
  ];
}

export function getBobineFilleClichePoseColumns(stocks: {
  [key: string]: Stock[];
}): AnyColumnMetadata<BobineFilleClichePose>[] {
  return [
    BobineFilleClichePoseColumns.Ref,
    BobineFilleClichePoseColumns.Laize,
    BobineFilleClichePoseColumns.CouleurPapier,
    BobineFilleClichePoseColumns.Grammage,
    BobineFilleClichePoseColumns.Stock(stocks),
    BobineFilleClichePoseColumns.Pose,
    BobineFilleClichePoseColumns.CouleursImpression,
    BobineFilleClichePoseColumns.ImportanceOrdreCouleurs,
    BobineFilleClichePoseColumns.Longueur,
    BobineFilleClichePoseColumns.TypeImpression,
  ];
}

export function getBobineMereColumns(stocks: {
  [key: string]: Stock[];
}): AnyColumnMetadata<BobineMere>[] {
  return [
    BobineMereColumns.Ref,
    BobineMereColumns.Designation,
    BobineMereColumns.Laize,
    BobineMereColumns.Longueur,
    BobineMereColumns.CouleurPapier,
    BobineMereColumns.Grammage,
    BobineMereColumns.Stock(stocks),
    BobineMereColumns.LastUpdate,
  ];
}

export function getClicheColumns(): AnyColumnMetadata<Cliche>[] {
  return [
    ClicheColumns.Ref,
    ClicheColumns.Designation,
    ClicheColumns.NombrePoses,
    ClicheColumns.Couleur1,
    ClicheColumns.Couleur2,
    ClicheColumns.Couleur3,
    ClicheColumns.ImportanceOrdreCouleurs,
    ClicheColumns.LastUpdate,
  ];
}

export function getPerfoColumns(): AnyColumnMetadata<Perfo>[] {
  return [
    PerfoColumns.Ref,
    PerfoColumns.DecalageInitial,
    PerfoColumns.Cale1,
    PerfoColumns.Bague1,
    PerfoColumns.Cale2,
    PerfoColumns.Bague2,
    PerfoColumns.Cale3,
    PerfoColumns.Bague3,
    PerfoColumns.Cale4,
    PerfoColumns.Bague4,
    PerfoColumns.Cale5,
    PerfoColumns.Bague5,
    PerfoColumns.Cale6,
    PerfoColumns.Bague6,
    PerfoColumns.Cale7,
    PerfoColumns.Bague7,
    PerfoColumns.LastUpdate,
  ];
}

export function getRefenteColumns(): AnyColumnMetadata<Refente>[] {
  return [
    RefenteColumns.Ref,
    RefenteColumns.RefPerfo,
    RefenteColumns.Decalage,
    RefenteColumns.Laize1,
    RefenteColumns.Laize2,
    RefenteColumns.Laize3,
    RefenteColumns.Laize4,
    RefenteColumns.Laize5,
    RefenteColumns.Laize6,
    RefenteColumns.Laize7,
    RefenteColumns.Chute,
    RefenteColumns.LastUpdate,
  ];
}

export function getOperationsColumns(): AnyColumnMetadata<Operation>[] {
  return [
    OperationColumns.Id,
    OperationColumns.Description,
    OperationColumns.Required,
    OperationColumns.Constraint,
    OperationColumns.Duration,
    OperationColumns.LastUpdate,
  ];
}
