import * as React from 'react';
import styled from 'styled-components';

import {PlanProductionBobineFilleClichePose} from '@root/components/apps/main/gestion/plan_prod_bobine_fille';
import {PlanProductionPapier} from '@root/components/apps/main/gestion/plan_prod_papier';
import {PlanProductionPerfo} from '@root/components/apps/main/gestion/plan_prod_perfo';
import {PlanProductionPolypro} from '@root/components/apps/main/gestion/plan_prod_polypro';
import {PlanProductionRefente} from '@root/components/apps/main/gestion/plan_prod_refente';
import {PlanProductionEngine} from '@root/lib/plan_production/engine';

import {BobineFille, BobineMere, Cliche, Perfo, Refente, Stock} from '@shared/models';

interface Props {
  bobinesFilles: BobineFille[];
  bobinesMeres: BobineMere[];
  cliches: Cliche[];
  refentes: Refente[];
  perfos: Perfo[];
  stocks: {[key: string]: Stock[]};
}

interface State {
  planProductionEngine: PlanProductionEngine;
}

export class PlanProduction extends React.Component<Props, State> {
  public static displayName = 'PlanProduction';
  private isMounted: boolean = false;

  public constructor(props: Props) {
    super(props);
    const {bobinesFilles, bobinesMeres, cliches, refentes, perfos} = props;
    this.state = {
      planProductionEngine: new PlanProductionEngine(
        bobinesFilles,
        bobinesMeres,
        cliches,
        refentes,
        perfos,
        this.handlePlanProductionChange
      ),
    };
  }

  public componentDidMount(): void {
    this.isMounted = true;
  }

  public componentWillUnmount(): void {
    this.isMounted = false;
  }

  private readonly handlePlanProductionChange = (): void => {
    if (this.isMounted) {
      this.forceUpdate();
    }
  };

  public render(): JSX.Element {
    const plan = this.state.planProductionEngine;
    const {bobinesMeres, refentes, stocks} = this.props;
    const {
      selectableBobinesFilles,
      selectableRefentes,
      selectablePapiers,
      selectablePerfos,
      selectablePolypros,
    } = plan.selectables;

    return (
      <div>
        <PlanProdWrapper>
          <ProdElement>
            <ProdElementTitle>{`Bobines (${selectableBobinesFilles.length})`}</ProdElementTitle>
            <ProdElementWrapper>
              <PlanProductionBobineFilleClichePose planProd={plan} stocks={stocks} />
            </ProdElementWrapper>
          </ProdElement>
          <ProdElement>
            <ProdElementTitle>{`Refente (${selectableRefentes.length})`}</ProdElementTitle>
            <ProdElementWrapper>
              <PlanProductionRefente planProd={plan} allRefentes={refentes} />
            </ProdElementWrapper>
          </ProdElement>
          <ProdElement>
            <ProdElementTitle>{`Papier (${selectablePapiers.length})`}</ProdElementTitle>
            <ProdElementWrapper>
              <PlanProductionPapier
                planProd={plan}
                allBobinesMeres={bobinesMeres}
                stocks={stocks}
              />
            </ProdElementWrapper>
          </ProdElement>
          <ProdElement>
            <ProdElementTitle>{`Perfo (${selectablePerfos.length})`}</ProdElementTitle>
            <ProdElementWrapper>
              <PlanProductionPerfo planProd={plan} />
            </ProdElementWrapper>
          </ProdElement>
          <ProdElement>
            <ProdElementTitle>{`Polypro (${selectablePolypros.length})`}</ProdElementTitle>
            <ProdElementWrapper>
              <PlanProductionPolypro
                planProd={plan}
                allBobinesMeres={bobinesMeres}
                stocks={stocks}
              />
            </ProdElementWrapper>
          </ProdElement>
        </PlanProdWrapper>
        <PlanProdFooter>
          <button onClick={() => plan.recalculate()}>Recalcule</button>
          <CalculationTime>{`Calculé en ${Math.round(plan.calculationTime * 100) /
            100}ms`}</CalculationTime>
        </PlanProdFooter>
      </div>
    );
  }
}

const PlanProdWrapper = styled.div`
  display: flex;
`;

const PlanProdFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 48px;
`;

const ProdElement = styled.div`
  flex-grow: 1;
  flex-basis: 0;
  margin-right: 24px;
  &:last-of-type {
    margin-right: 0;
  }
`;

const ProdElementTitle = styled.div`
  text-align: center;
  font-size: 14px;
  font-weight: 600;
`;

const ProdElementWrapper = styled.div`
  height: 700px;
  margin-top: 12px;
  background-color: #ddd;

  display: flex;
  align-items: center;
  justify-content: center;
`;

const CalculationTime = styled.div`
  width: 100%;
  text-align: right;
`;
