import {keyBy} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {Button} from '@root/components/core/button';
import {SizeMonitor} from '@root/components/core/size_monitor';
import {FilterableTable} from '@root/components/table/filterable_table';
import {getBobineMereColumns} from '@root/components/table/table_columns';
import {PlanProductionEngine} from '@root/lib/plan_production/algo';
import {appStore} from '@root/stores/app_store';
import {theme} from '@root/theme/default';

import {BobineMere, Stock} from '@shared/models';

interface Props {
  allBobinesMeres: BobineMere[];
  stocks: {[key: string]: Stock[]};
  planProd: PlanProductionEngine;
}

export class PlanProductionPolypro extends React.Component<Props> {
  public static displayName = 'PlanProductionPolypro';

  private readonly handleAddPolypro = (): void => {
    const {planProd, allBobinesMeres, stocks} = this.props;
    const bobinesMeresByRef = keyBy(allBobinesMeres, 'ref');
    const bobineMereTable = (
      <SizeMonitor>
        {(width, height) => {
          const modalPadding = 2 * theme.modal.margin + 2 * theme.modal.padding;
          return (
            <FilterableTable
              data={planProd.allPolypros.map(b => bobinesMeresByRef[b.ref])}
              lastUpdate={0}
              columns={getBobineMereColumns(stocks)}
              initialSort={{
                columnName: 'ref',
                asc: true,
              }}
              onSelected={(bobineMere: BobineMere) => {
                const selectedPolypro = planProd.allPolypros.filter(
                  r => r.ref === bobineMere.ref
                )[0];
                planProd.setPolypro(selectedPolypro);
                this.forceUpdate();
                appStore.closeModal();
              }}
              title="polypro"
              filterTitle="non selectionnable"
              filterFunction={bobineMere => {
                return planProd.selectablePolypros.map(r => r.ref).indexOf(bobineMere.ref) !== -1;
              }}
              width={width - modalPadding}
              height={height - modalPadding}
            />
          );
        }}
      </SizeMonitor>
    );
    appStore.openModal(bobineMereTable);
  };

  private readonly handleRemovePolypro = (): void => {
    this.props.planProd.setPolypro(undefined);
  };

  private renderPolypro(bobineMere: BobineMere): JSX.Element {
    return (
      <PolyproWrapper>
        {`Polypro: ${bobineMere.ref}`}
        <br />
        {`Laize: ${bobineMere.laize}`}
        <br />
        {`Grammage: ${bobineMere.grammage}`}
      </PolyproWrapper>
    );
  }

  public render(): JSX.Element {
    const {allBobinesMeres, planProd} = this.props;
    const polypro = planProd.planProduction.polypro;
    const bobineMereRef = polypro && polypro.ref;
    const bobineMereModel: BobineMere | undefined = allBobinesMeres.filter(
      r => r.ref === bobineMereRef
    )[0];

    return (
      <ProdElementWrapper>
        {bobineMereModel ? (
          <React.Fragment>
            {this.renderPolypro(bobineMereModel)}
            <Button onClick={this.handleRemovePolypro}>Enlever Polypro</Button>
          </React.Fragment>
        ) : (
          <Button onClick={this.handleAddPolypro}>Selection Polypro</Button>
        )}
      </ProdElementWrapper>
    );
  }
}

const ProdElementWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #ddd;
`;

const PolyproWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;
