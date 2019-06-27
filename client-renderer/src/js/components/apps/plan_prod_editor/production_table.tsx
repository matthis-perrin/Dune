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
} from '@root/components/table/columns';
import {SortableTable} from '@root/components/table/sortable_table';
import {getStock, getBobineState} from '@root/lib/bobine';
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
}

export class ProductionTable extends React.Component<ProductionTableProps> {
  public static displayName = 'ProductionTable';

  public render(): JSX.Element {
    const {width, planProduction, stocks, cadencier, bobineQuantities, onRemove} = this.props;

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
      const stock = getStock(ref, stocks);
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
      };
    });

    let columns = [
      withWidth(toStaticColumn(BOBINE_FILLE_REF_COLUMN), undefined),
      toStaticColumn(LAIZE_COLUMN),
      toStaticColumn(PISTES_COLUMN),
      toStaticColumn(STATE_ACTUEL_COLUMN),
      toStaticColumn(QUANTITY_COLUMN),
      toStaticColumn(STOCK_ACTUEL_COLUMN),
      toStaticColumn(PRODUCTION_COLUMN),
      toStaticColumn(STOCK_PREVISIONEL_COLUMN),
      toStaticColumn(STATE_PREVISIONEL_COLUMN),
      CLOSE_COLUMN<{ref: string}>(({ref}) => onRemove && onRemove(ref)),
    ];

    if (!onRemove) {
      columns = columns.slice(0, columns.length - 1);
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
