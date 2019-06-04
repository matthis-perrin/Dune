import {PlanProductionEngine} from 'C:\Users\Matthis\git\dune\client-renderer\src\js\components\apps\main\client-main\src\plan_production\engine';
import {keyBy} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {Button} from '@root/components/core/button';
import {SizeMonitor} from '@root/components/core/size_monitor';
import {FilterableTable} from '@root/components/table/filterable_table';
import {getBobineMereColumns} from '@root/components/table/table_columns';
import {appStore} from '@root/stores/app_store';
import {theme} from '@root/theme/default';

import {BobineMere, Stock} from '@shared/models';

interface Props {
  allBobinesMeres: BobineMere[];
  stocks: {[key: string]: Stock[]};
  planProd: PlanProductionEngine;
}

export class PlanProductionPapier extends React.Component<Props> {
  public static displayName = 'PlanProductionPapier';

  private shouldShow(papier: BobineMere, isSelectionnable: boolean): boolean {
    const index = this.props.planProd.selectables.selectablePapiers
      .map(p => p.ref)
      .indexOf(papier.ref);
    return isSelectionnable ? index !== -1 : index === -1;
  }

  private readonly shouldShowSelectionnableRow = (
    papier: BobineMere,
    enabled: boolean
  ): boolean => {
    return enabled && this.shouldShow(papier, true);
  };

  private readonly shouldShowNonSelectionnableRow = (
    papier: BobineMere,
    enabled: boolean
  ): boolean => {
    return enabled && this.shouldShow(papier, false);
  };

  private readonly handleAddPapier = (): void => {
    const {planProd, allBobinesMeres, stocks} = this.props;
    const bobinesMeresByRef = keyBy(allBobinesMeres, 'ref');
    const bobineMereTable = (
      <SizeMonitor>
        {(width, height) => {
          const modalPadding = 2 * theme.modal.margin + 2 * theme.modal.padding;
          const tableBorderNumber = 3;
          return (
            <FilterableTable
              data={planProd.allPapiers.map(b => bobinesMeresByRef[b.ref])}
              lastUpdate={0}
              columns={getBobineMereColumns(stocks)}
              initialSort={{
                columnName: 'ref',
                asc: true,
              }}
              onSelected={(bobineMere: BobineMere) => {
                const selectedPapier = planProd.allPapiers.filter(r => r.ref === bobineMere.ref)[0];
                planProd.setPapier(selectedPapier);
                this.forceUpdate();
                appStore.closeModal();
              }}
              title="papier"
              filters={[
                {
                  enableByDefault: true,
                  title: 'Bobines mères papier sélectionnables',
                  shouldShowRow: this.shouldShowSelectionnableRow,
                },
                {
                  enableByDefault: false,
                  title: 'Bobines mères papier non-sélectionnables',
                  shouldShowRow: this.shouldShowNonSelectionnableRow,
                },
              ]}
              isRowDisabled={bobineMere =>
                planProd.selectables.selectablePapiers.map(p => p.ref).indexOf(bobineMere.ref) ===
                -1
              }
              width={width - modalPadding - tableBorderNumber * theme.table.borderThickness}
              height={height - modalPadding}
            />
          );
        }}
      </SizeMonitor>
    );
    appStore.openModal(bobineMereTable);
  };

  private readonly handleRemovePapier = (): void => {
    this.props.planProd.setPapier(undefined);
  };

  private renderPapier(bobineMere: BobineMere): JSX.Element {
    return (
      <PapierWrapper>
        {`Papier: ${bobineMere.ref}`}
        <br />
        {`Laize: ${bobineMere.laize}`}
        <br />
        {`Couleur: ${bobineMere.couleurPapier}`}
        <br />
        {`Grammage: ${bobineMere.grammage}`}
        <br />
        {`Longueur: ${bobineMere.longueur}`}
      </PapierWrapper>
    );
  }

  public render(): JSX.Element {
    const {allBobinesMeres, planProd} = this.props;
    const papier = planProd.planProduction.papier;
    const bobineMereRef = papier && papier.ref;
    const bobineMereModel: BobineMere | undefined = allBobinesMeres.filter(
      r => r.ref === bobineMereRef
    )[0];

    return (
      <ProdElementWrapper>
        {bobineMereModel ? (
          <React.Fragment>
            {this.renderPapier(bobineMereModel)}
            <Button onClick={this.handleRemovePapier}>Enlever Papier</Button>
          </React.Fragment>
        ) : (
          <Button onClick={this.handleAddPapier}>Selection Papier</Button>
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

const PapierWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;
