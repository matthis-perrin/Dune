import {keyBy} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {Button} from '@root/components/core/button';
import {SizeMonitor} from '@root/components/core/size_monitor';
import {FilterableTable} from '@root/components/table/filterable_table';
import {getRefenteColumns} from '@root/components/table/table_columns';
import {PlanProductionEngine} from '@root/lib/plan_production/algo';
import {appStore} from '@root/stores/app_store';
import {theme} from '@root/theme/default';

import {Refente} from '@shared/models';

interface Props {
  allRefentes: Refente[];
  planProd: PlanProductionEngine;
}

export class PlanProductionRefente extends React.Component<Props> {
  public static displayName = 'PlanProductionRefente';

  private readonly handleAddRefente = (): void => {
    const {planProd, allRefentes} = this.props;
    const refentesByRef = keyBy(allRefentes, 'ref');
    const refenteTable = (
      <SizeMonitor>
        {(width, height) => {
          const modalPadding = 2 * theme.modal.margin + 2 * theme.modal.padding;
          return (
            <FilterableTable
              data={planProd.allRefentes.map(r => refentesByRef[r.ref])}
              lastUpdate={0}
              columns={getRefenteColumns()}
              initialSort={{
                columnName: 'ref',
                asc: true,
              }}
              onSelected={(refente: Refente) => {
                const selectedRefente = planProd.allRefentes.filter(r => r.ref === refente.ref)[0];
                planProd.setRefente(selectedRefente);
                this.forceUpdate();
                appStore.closeModal();
              }}
              title="refente"
              filterTitle="non selectionnable"
              filterFunction={refente => {
                return planProd.selectableRefentes.map(r => r.ref).indexOf(refente.ref) !== -1;
              }}
              width={width - modalPadding}
              height={height - modalPadding}
            />
          );
        }}
      </SizeMonitor>
    );
    appStore.openModal(refenteTable);
  };

  private readonly handleRemoveRefente = (): void => {
    this.props.planProd.setRefente(undefined);
  };

  private renderDecalage(size: number | undefined): JSX.Element {
    return <Decalage>{`Décalage de ${size || 0}`}</Decalage>;
  }

  private renderLaize(laize: number): JSX.Element {
    return <Laize>{laize}</Laize>;
  }

  private renderRefente(refente: Refente): JSX.Element {
    const elements: JSX.Element[] = [this.renderDecalage(refente.decalage)];
    [
      refente.laize1,
      refente.laize2,
      refente.laize3,
      refente.laize4,
      refente.laize5,
      refente.laize6,
      refente.laize7,
    ].forEach(l => {
      if (l !== undefined) {
        elements.push(this.renderLaize(l));
      }
    });

    return <RefenteWrapper>{elements}</RefenteWrapper>;
  }

  public render(): JSX.Element {
    const {allRefentes, planProd} = this.props;
    const refente = planProd.planProduction.refente;
    const refenteRef = refente && refente.ref;
    const refenteModel: Refente | undefined = allRefentes.filter(r => r.ref === refenteRef)[0];

    return (
      <ProdElementWrapper>
        {refenteModel ? (
          <React.Fragment>
            {this.renderRefente(refenteModel)}
            <Button onClick={this.handleRemoveRefente}>Enlever Refente</Button>
          </React.Fragment>
        ) : (
          <Button onClick={this.handleAddRefente}>Selection Refente</Button>
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

const RefenteWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const RefenteElement = styled.div`
  display: flex;
  align-item: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 500;
  background-color: #c0c0c0;
`;

const Decalage = styled(RefenteElement)`
  width: 120px;
  padding: 12px 0;
`;

const Laize = styled(RefenteElement)`
  width: 120px;
  padding: 8px 0;
  margin-top: 8px;
`;
