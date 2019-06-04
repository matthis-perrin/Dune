import {PlanProductionEngine} from 'C:\Users\Matthis\git\dune\client-renderer\src\js\components\apps\main\client-main\src\plan_production\engine';
import * as React from 'react';
import styled from 'styled-components';

import {PlanProductionBobineFilleClichePose} from '@root/components/apps/main/gestion/plan_prod_bobine_fille';
import {PlanProductionPapier} from '@root/components/apps/main/gestion/plan_prod_papier';
import {PlanProductionPerfo} from '@root/components/apps/main/gestion/plan_prod_perfo';
import {PlanProductionPolypro} from '@root/components/apps/main/gestion/plan_prod_polypro';
import {PlanProductionRefente} from '@root/components/apps/main/gestion/plan_prod_refente';
import {Perfo as PerfoComponent} from '@root/components/common/perfo';
import {Refente as RefenteComponent} from '@root/components/common/refente';
import {SizeMonitor} from '@root/components/core/size_monitor';
import {theme} from '@root/theme/default';

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
    const {bobinesMeres, refentes, stocks, perfos} = this.props;
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
        <SizeMonitor>
          {width => {
            const CAPACITE_MACHINE = 980;
            const pixelPerMM =
              (width - (theme.sidebar.width + 2 * theme.page.padding)) / CAPACITE_MACHINE;
            return (
              <div style={{width: CAPACITE_MACHINE * pixelPerMM}}>
                {perfos.map(p => (
                  <React.Fragment>
                    <PerfoComponent perfo={p} pixelPerMM={pixelPerMM} />
                    <br />
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
                      {refentes
                        .filter(r => r.refPerfo === p.ref)
                        .map(r => (
                          <React.Fragment>
                            <RefenteComponent refente={r} pixelPerMM={pixelPerMM} />
                            <br />
                          </React.Fragment>
                        ))}
                    </div>
                    <br />
                  </React.Fragment>
                ))}
              </div>
            );
          }}
        </SizeMonitor>
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
