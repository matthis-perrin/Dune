import * as React from 'react';

import {Calendar} from '@root/components/apps/main/gestion/calendar';
import {PlanProdTile} from '@root/components/apps/main/gestion/plan_prod_tile';
import {Page} from '@root/components/apps/main/page';
import {bridge} from '@root/lib/bridge';
import {contextMenuManager} from '@root/lib/context_menu';
import {PlansProdOrder, orderPlansProd, getPlanProdsForDate} from '@root/lib/plan_prod_order';
import {dateIsAfterOrSameDay, dateIsBeforeOrSameDay} from '@root/lib/utils';
import {bobinesQuantitiesStore, operationsStore} from '@root/stores/data_store';
import {plansProductionStore, stocksStore, cadencierStore} from '@root/stores/list_store';

import {PlanProduction, Stock, BobineQuantities, Operation, ClientAppType} from '@shared/models';

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
      const orderedPlans = orderPlansProd(activePlansProd, operations, []);
      this.setState({
        // TODO - Fetch non prod here
        orderedPlans,
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

  private isValidDateToCreatePlanProd(date: Date): boolean {
    return dateIsAfterOrSameDay(date, new Date());
  }

  private getNewPlanProdIndexForDate(date: Date): number {
    const {orderedPlans} = this.state;
    if (!orderedPlans) {
      return 0;
    }
    const {scheduled} = orderedPlans;
    return scheduled.reduce(
      (acc, curr) =>
        curr.plan.index !== undefined &&
        curr.plan.index >= acc &&
        dateIsBeforeOrSameDay(curr.estimatedReglageStart, date)
          ? curr.plan.index + 1
          : acc,
      0
    );
  }

  private readonly handleDayContextMenu = (event: React.MouseEvent, date: Date): void => {
    if (event.type === 'contextmenu' && this.isValidDateToCreatePlanProd(date)) {
      contextMenuManager
        .open([
          {
            label: `Nouveau plan de production le ${date.toLocaleDateString('fr')}`,
            callback: () => {
              const planProdIndex = this.getNewPlanProdIndexForDate(date);
              bridge
                .createNewPlanProduction(planProdIndex)
                .then(({id}) => {
                  bridge
                    .openApp(ClientAppType.PlanProductionEditorApp, {id, isCreating: true})
                    .catch(console.error);
                })
                .catch(err => console.error(err));
            },
          },
        ])
        .catch(console.error);
    }
  };

  private readonly handleDayClick = (event: React.MouseEvent, date: Date): void => {
    bridge.viewDay(date.getTime()).catch(console.error);
  };

  public renderDay(date: Date): JSX.Element {
    const {stocks, cadencier, bobineQuantities, operations, plansProd, orderedPlans} = this.state;
    if (!stocks || !cadencier || !bobineQuantities || !operations || !plansProd || !orderedPlans) {
      return <div />;
    }
    const {done, inProgress, scheduled} = getPlanProdsForDate(orderedPlans, date);
    return (
      <div>
        {done.map(p => (
          <PlanProdTile
            key={p.plan.id}
            date={date}
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
            key={inProgress.plan.id}
            date={date}
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
            key={p.plan.id}
            date={date}
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
          onDayClick={this.handleDayClick}
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
