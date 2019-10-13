import * as React from 'react';

import {
  LAIZE_COLUMN,
  PRODUCTION_COLUMN,
  STOCK_PREVISIONEL_COLUMN,
  toStaticColumn,
  withWidth,
  BOBINE_FILLE_REF_COLUMN,
} from '@root/components/table/columns';
import {SortableTable, ColumnMetadata} from '@root/components/table/sortable_table';
import {getSchedulesForDay, getScheduleStart} from '@root/lib/schedule_utils';
import {getStockTermePrevisionel} from '@root/lib/stocks';
import {theme} from '@root/theme';

import {getPoseSize} from '@shared/lib/cliches';
import {endOfDay} from '@shared/lib/utils';
import {Stock, Schedule} from '@shared/models';
import {removeUndefined} from '@shared/type_utils';

interface DayProductionTableProps {
  width: number;
  stocks: Map<string, Stock[]>;
  schedule: Schedule;
  day: number;
}

interface RowData {
  ref: string;
  laize: number;
  production: number;
  newStock: number;
}

export class DayProductionTable extends React.Component<DayProductionTableProps> {
  public static displayName = 'DayProductionTable';

  public render(): JSX.Element {
    const {width, stocks, schedule, day} = this.props;

    const current = schedule.lastSpeedTime === undefined ? Date.now() : schedule.lastSpeedTime.time;
    const isFuture = endOfDay(new Date(day)).getTime() > current;

    const schedules = getSchedulesForDay(schedule, new Date(day));
    const firstScheduleStart = schedules.map(getScheduleStart).sort()[0];

    const refs = new Map<string, {laize?: number; prod: number}>();
    schedules.forEach(s => {
      const bobines = s.planProd.data.bobines;
      const meters = s.doneProdMeters + s.plannedProdMeters;
      const longueurFirstBobine = bobines.length > 0 ? bobines[0].longueur || 0 : 0;
      const tour = Math.round(meters / longueurFirstBobine);
      if (tour > 0) {
        bobines.forEach(b => {
          const pose = getPoseSize(b.pose);
          const bData = refs.get(b.ref);
          if (bData === undefined) {
            refs.set(b.ref, {laize: b.laize, prod: pose * tour});
          } else {
            bData.prod += pose * tour;
          }
        });
      }
    });

    const data: RowData[] = removeUndefined(
      Array.from(refs.keys())
        .sort()
        .map(ref => {
          const bData = refs.get(ref);
          if (!bData) {
            return undefined;
          }
          const stockPrevisionel =
            firstScheduleStart === undefined
              ? 0
              : getStockTermePrevisionel(ref, stocks, schedule, firstScheduleStart);
          return {
            ref,
            laize: bData.laize || 0,
            production: Math.round(bData.prod),
            newStock: Math.round(bData.prod + stockPrevisionel),
          };
        })
    );

    // tslint:disable-next-line:no-any
    const columns: ColumnMetadata<RowData, any>[] = [
      withWidth(toStaticColumn(BOBINE_FILLE_REF_COLUMN), undefined),
      toStaticColumn(LAIZE_COLUMN),
      toStaticColumn(PRODUCTION_COLUMN),
    ];

    if (isFuture) {
      columns.push(toStaticColumn(STOCK_PREVISIONEL_COLUMN));
    }

    return (
      <SortableTable
        width={width}
        height={theme.table.headerHeight + data.length * theme.table.rowHeight}
        columns={columns}
        data={data}
      />
    );
  }
}
