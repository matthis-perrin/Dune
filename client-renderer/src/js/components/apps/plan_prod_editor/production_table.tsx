import * as React from 'react';

import {
  LAIZE_COLUMN,
  PISTES_COLUMN,
  STOCK_ACTUEL_COLUMN,
  STATE_ACTUEL_COLUMN,
  QUANTITY_COLUMN,
  PRODUCTION_COLUMN,
  STOCK_PREVISIONEL_COLUMN,
  STATE_PREVISIONEL_COLUMN,
  toStaticColumn,
  withWidth,
  CLOSE_COLUMN,
  BOBINE_FILLE_REF_COLUMN,
  MINIMUM_COLUMN,
} from '@root/components/table/columns';
import {SortableTable, ColumnMetadata} from '@root/components/table/sortable_table';
import {getStockTerme, getBobineState} from '@root/lib/bobine';
import {theme} from '@root/theme';

import {getPoseSize} from '@shared/lib/cliches';
import {Stock, BobineQuantities, PlanProductionState, BobineFilleWithPose} from '@shared/models';

interface ProductionTableProps {
  width: number;
  planProduction: PlanProductionState;
  stocks: Map<string, Stock[]>;
  cadencier: Map<string, Map<number, number>>;
  bobineQuantities: BobineQuantities[];
  onRemove?(ref: string): void;
  canRemove: boolean;
  minimums?: Map<string, number>;
  onMiniUpdated?(ref: string, newMini: number): void;
}

export class ProductionTable extends React.Component<ProductionTableProps> {
  public static displayName = 'ProductionTable';

  public render(): JSX.Element {
    const {
      width,
      planProduction,
      stocks,
      cadencier,
      bobineQuantities,
      onRemove,
      canRemove,
      onMiniUpdated,
      minimums,
    } = this.props;

    const selectedBobines = new Map<string, BobineFilleWithPose>();
    const selectedPistesSum = new Map<string, number>();
    planProduction.selectedBobines.forEach(b => {
      const piste = selectedPistesSum.get(b.ref) || 0;
      selectedPistesSum.set(b.ref, piste + getPoseSize(b.pose));
      selectedBobines.set(b.ref, b);
    });
    const data = Array.from(selectedBobines.entries()).map(([ref, bobine]) => {
      const pistes = selectedPistesSum.get(ref) || 0;
      const production = (planProduction.tourCount || 0) * pistes;
      const stock = getStockTerme(ref, stocks);
      const {state, info, quantity} = getBobineState(
        bobine.ref,
        stocks,
        cadencier,
        bobineQuantities,
        0
      );
      const newStock = stock + production;
      const newBobineState = getBobineState(
        bobine.ref,
        stocks,
        cadencier,
        bobineQuantities,
        production
      );

      return {
        ref: bobine.ref,
        laize: bobine.laize,
        pistes,
        production,
        stock,
        state,
        info,
        quantity,
        newStock,
        newState: newBobineState.state,
        newInfo: newBobineState.info,
        minimum: (minimums && minimums.get(bobine.ref)) || production,
      };
    });

    // tslint:disable-next-line:no-any
    const columns = [
      withWidth(toStaticColumn(BOBINE_FILLE_REF_COLUMN), undefined),
      toStaticColumn(LAIZE_COLUMN),
      toStaticColumn(PISTES_COLUMN),
      toStaticColumn(STATE_ACTUEL_COLUMN),
      toStaticColumn(QUANTITY_COLUMN),
      toStaticColumn(STOCK_ACTUEL_COLUMN),
      toStaticColumn(PRODUCTION_COLUMN),
    ];

    if (minimums) {
      columns.push(
        MINIMUM_COLUMN<{ref: string; minimum: number}>((ref, newMinimum) => {
          onMiniUpdated(ref, isNaN(newMinimum) ? 0 : newMinimum);
        })
      );
    }

    columns.push(toStaticColumn(STOCK_PREVISIONEL_COLUMN));
    columns.push(toStaticColumn(STATE_PREVISIONEL_COLUMN));

    if (canRemove) {
      columns.push(CLOSE_COLUMN<{ref: string}>(({ref}) => onRemove && onRemove(ref)));
    }

    return (
      <SortableTable
        width={width}
        height={data.length * theme.table.rowHeight + theme.table.headerHeight}
        data={data}
        columns={columns}
        initialSort={{
          index: 0,
          asc: true,
        }}
      />
    );
  }
}
