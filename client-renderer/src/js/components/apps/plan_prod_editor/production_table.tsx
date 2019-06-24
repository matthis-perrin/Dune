import * as React from 'react';

import {
  LAIZE_COLUMN,
  BOBINE_FILLE_REF,
  PISTES_COLUMN,
  STOCK_ACTUEL_COLUMN,
  STATE_ACTUEL_COLUMN,
  QUANTITY_COLUMN,
  PRODUCTION_COLUMN,
  STOCK_PREVISIONEL_COLUMN,
  STATE_PREVISIONEL_COLUMN,
  toStaticColumn,
  withWidth,
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
}

export class ProductionTable extends React.Component<ProductionTableProps> {
  public static displayName = 'ProductionTable';

  public render(): JSX.Element {
    const {width, planProduction, stocks, cadencier, bobineQuantities} = this.props;

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
      const {state, quantity} = getBobineState(bobine.ref, stocks, cadencier, bobineQuantities, 0);
      const newStock = stock + production;
      const newState = getBobineState(bobine.ref, stocks, cadencier, bobineQuantities, production)
        .state;
      return {
        ref: bobine.ref,
        laize: bobine.laize,
        pistes,
        production,
        stock,
        state,
        quantity,
        newStock,
        newState,
      };
    });

    const columns = [
      withWidth(toStaticColumn(BOBINE_FILLE_REF), undefined),
      withWidth(toStaticColumn(LAIZE_COLUMN), 70),
      withWidth(toStaticColumn(PISTES_COLUMN), 70),
      withWidth(toStaticColumn(STOCK_ACTUEL_COLUMN), 120),
      withWidth(toStaticColumn(STATE_ACTUEL_COLUMN), 120),
      withWidth(toStaticColumn(QUANTITY_COLUMN), 170),
      withWidth(toStaticColumn(PRODUCTION_COLUMN), 120),
      withWidth(toStaticColumn(STOCK_PREVISIONEL_COLUMN), 170),
      withWidth(toStaticColumn(STATE_PREVISIONEL_COLUMN), 170),
    ];

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
