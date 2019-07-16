import * as React from 'react';

import {Calendar} from '@root/components/apps/main/gestion/calendar';
import {PlanProdTile} from '@root/components/apps/main/gestion/plan_prod_tile';
import {Page} from '@root/components/apps/main/page';
import {PlansProdOrder, orderPlansProd} from '@root/lib/plan_prod';
import {bobinesQuantitiesStore, operationsStore} from '@root/stores/data_store';
import {plansProductionStore, stocksStore, cadencierStore} from '@root/stores/list_store';

import {
  /*ClientAppType, */ PlanProduction,
  Stock,
  BobineQuantities,
  Operation,
} from '@shared/models';

const LAST_MONTH = 11;

interface Props {}

interface State {
  stocks?: Map<string, Stock[]>;
  cadencier?: Map<string, Map<number, number>>;
  bobineQuantities?: BobineQuantities[];
  plansProd?: PlanProduction[];
  operations?: Operation[];
  orderedPlans?: PlansProdOrder;
  month: number;
  year: number;
}

export class GestionPage extends React.Component<Props, State> {
  public static displayName = 'GestionPage';

  public constructor(props: Props) {
    super(props);
    this.state = {
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
    };
  }

  public componentDidMount(): void {
    stocksStore.addListener(this.handleStoresChanged);
    cadencierStore.addListener(this.handleStoresChanged);
    bobinesQuantitiesStore.addListener(this.handleStoresChanged);
    plansProductionStore.addListener(this.recomputePlanOrder);
    operationsStore.addListener(this.recomputePlanOrder);
  }

  public componentWillUnmount(): void {
    stocksStore.removeListener(this.handleStoresChanged);
    cadencierStore.removeListener(this.handleStoresChanged);
    bobinesQuantitiesStore.removeListener(this.handleStoresChanged);
    plansProductionStore.removeListener(this.recomputePlanOrder);
    operationsStore.removeListener(this.recomputePlanOrder);
  }

  private readonly recomputePlanOrder = (): void => {
    const activePlansProd = plansProductionStore.getActivePlansProd();
    const operations = operationsStore.getData();
    if (activePlansProd && operations) {
      this.setState({
        // TODO - Fetch non prod here
        orderedPlans: orderPlansProd(activePlansProd, operations, []),
        plansProd: activePlansProd,
        operations,
      });
    }
  };

  private readonly handleStoresChanged = (): void => {
    this.setState({
      stocks: stocksStore.getStockIndex(),
      cadencier: cadencierStore.getCadencierIndex(),
      bobineQuantities: bobinesQuantitiesStore.getData(),
    });
  };

  private readonly goToNextMonth = (): void => {
    const {year, month} = this.state;
    const newYear = month === LAST_MONTH ? year + 1 : year;
    const newMonth = month === LAST_MONTH ? 0 : month + 1;
    this.setState({year: newYear, month: newMonth});
  };

  private readonly goToPreviousMonth = (): void => {
    const {year, month} = this.state;
    const newYear = month === 0 ? year - 1 : year;
    const newMonth = month === 0 ? LAST_MONTH : month - 1;
    this.setState({year: newYear, month: newMonth});
  };

  private isSameDay(date1: Date, plan: PlanProduction): boolean {
    const date2 = new Date(plan.startTime || 0);
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  private getPlanProdsForDate(date: Date): PlansProdOrder {
    const {orderedPlans} = this.state;
    if (!orderedPlans) {
      return {done: [], scheduled: []};
    }
    const done = orderedPlans.done.filter(p => this.isSameDay(date, p.plan));
    const inProgress =
      orderedPlans.inProgress && this.isSameDay(date, orderedPlans.inProgress.plan)
        ? orderedPlans.inProgress
        : undefined;
    const scheduled = orderedPlans.scheduled.filter(p => this.isSameDay(date, p.plan));
    return {done, inProgress, scheduled};
  }

  private readonly handleDayContextMenu = (event: React.MouseEvent, date: Date): void => {
    // if (event.type === 'contextmenu') {
    //   contextMenuManager
    //     .open([
    //       {
    //         label: `Nouveau plan de production le ${date.toLocaleDateString('fr')}`,
    //         callback: () => {
    //           const plansForDate = this.getPlanProdsForDate(date);
    //           bridge
    //             .createNewPlanProduction(
    //               date.getFullYear(),
    //               date.getMonth(),
    //               date.getDate(),
    //               plansForDate.length
    //             )
    //             .then(data => {
    //               const id = asNumber(asMap(data).id, 0);
    //               bridge.openApp(ClientAppType.PlanProductionEditorApp, {id, isCreating: true}).catch(console.error);
    //             })
    //             .catch(err => console.error(err));
    //         },
    //       },
    //     ])
    //     .catch(console.error);
    // }
  };

  public renderDay(date: Date): JSX.Element {
    const {stocks, cadencier, bobineQuantities, operations, plansProd} = this.state;
    if (!stocks || !cadencier || !bobineQuantities || !operations || !plansProd) {
      return <div />;
    }
    const {done, inProgress, scheduled} = this.getPlanProdsForDate(date);
    return (
      <div>
        {done.map(p => (
          <PlanProdTile
            planProd={p}
            stocks={stocks}
            cadencier={cadencier}
            bobineQuantities={bobineQuantities}
            operations={operations}
            plansProd={plansProd}
          />
        ))}
        {inProgress ? (
          <PlanProdTile
            planProd={inProgress}
            stocks={stocks}
            cadencier={cadencier}
            bobineQuantities={bobineQuantities}
            operations={operations}
            plansProd={plansProd}
          />
        ) : (
          <React.Fragment />
        )}
        {scheduled.map(p => (
          <PlanProdTile
            planProd={p}
            stocks={stocks}
            cadencier={cadencier}
            bobineQuantities={bobineQuantities}
            operations={operations}
            plansProd={plansProd}
          />
        ))}
      </div>
    );
  }

  public render(): JSX.Element {
    const {month, year} = this.state;
    return (
      <Page>
        <Calendar
          month={month}
          year={year}
          onNextClick={this.goToNextMonth}
          onPreviousClick={this.goToPreviousMonth}
          onDayContextMenu={this.handleDayContextMenu}
        >
          {(date: Date) => <div>{this.renderDay(date)}</div>}
        </Calendar>
        {/* <Button
          onClick={() => {
            const date = new Date();
            bridge
              .createNewPlanProduction(date.getFullYear(), date.getMonth(), date.getDate(), 0)
              .then(data => {
                const id = asNumber(asMap(data).id, 0);
                bridge.openApp(ClientAppType.PlanProductionEditorApp, {id, isCreating: true}).catch(console.error);
              })
              .catch(err => console.error(err));
          }}
        >
          Créer un plan de production
        </Button> */}
      </Page>
    );
  }
}
