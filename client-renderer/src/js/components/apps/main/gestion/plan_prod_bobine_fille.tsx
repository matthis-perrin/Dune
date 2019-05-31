import * as React from 'react';
import styled from 'styled-components';

import {Button} from '@root/components/core/button';
import {SizeMonitor} from '@root/components/core/size_monitor';
import {FilterableTable} from '@root/components/table/filterable_table';
import {getBobineFilleClichePoseColumns} from '@root/components/table/table_columns';
import {PlanProductionEngine} from '@root/lib/plan_production/engine';
import {BobineFilleClichePose} from '@root/lib/plan_production/model';
import {appStore} from '@root/stores/app_store';
import {theme, getCouleurByName} from '@root/theme/default';

import {Stock} from '@shared/models';

interface Props {
  stocks: {[key: string]: Stock[]};
  planProd: PlanProductionEngine;
}

export class PlanProductionBobineFilleClichePose extends React.Component<Props> {
  public static displayName = 'PlanProductionBobineFilleClichePose';

  private shouldShow(bobine: BobineFilleClichePose, isSelectionnable: boolean): boolean {
    const index = this.props.planProd.selectables.selectableBobinesFilles.indexOf(bobine);
    return isSelectionnable ? index !== -1 : index === -1;
  }

  private readonly shouldShowSelectionnableRow = (
    bobine: BobineFilleClichePose,
    enabled: boolean
  ): boolean => {
    return enabled && this.shouldShow(bobine, true);
  };

  private readonly shouldShowNonSelectionnableRow = (
    bobine: BobineFilleClichePose,
    enabled: boolean
  ): boolean => {
    return enabled && this.shouldShow(bobine, false);
  };

  private readonly handleAddBobineFille = (): void => {
    const {planProd, stocks} = this.props;
    const bobineFilleTable = (
      <SizeMonitor>
        {(width, height) => {
          const modalPadding = 2 * theme.modal.margin + 2 * theme.modal.padding;
          const tableBorderNumber = 3;
          return (
            <FilterableTable
              data={planProd.allBobinesFilles}
              lastUpdate={0}
              columns={getBobineFilleClichePoseColumns(stocks)}
              initialSort={{
                columnName: 'ref',
                asc: true,
              }}
              onSelected={(bobineFille: BobineFilleClichePose) => {
                planProd.addBobineFille(bobineFille);
                this.forceUpdate();
                appStore.closeModal();
              }}
              title="bobine"
              filters={[
                {
                  enableByDefault: true,
                  title: 'Bobines filles sélectionnables',
                  shouldShowRow: this.shouldShowSelectionnableRow,
                },
                {
                  enableByDefault: false,
                  title: 'Bobines filles non-sélectionnables',
                  shouldShowRow: this.shouldShowNonSelectionnableRow,
                },
              ]}
              isRowDisabled={bobineFille =>
                planProd.selectables.selectableBobinesFilles.indexOf(bobineFille) === -1
              }
              width={width - modalPadding - tableBorderNumber * theme.table.borderThickness}
              height={height - modalPadding}
            />
          );
        }}
      </SizeMonitor>
    );
    appStore.openModal(bobineFilleTable);
  };

  private readonly handleRemoveBobineFille = (bobineFille: BobineFilleClichePose): void => {
    this.props.planProd.removeBobineFille(bobineFille);
  };

  private renderBobineFille(bobineFille: BobineFilleClichePose): JSX.Element {
    const elements: (JSX.Element | string)[] = [];
    for (let i = 0; i < bobineFille.pose; i++) {
      if (i > 0) {
        elements.push(<BobineFillePoseSeparator />);
      }
      elements.push(bobineFille.ref);
      elements.push(<br />);
      elements.push(`${bobineFille.couleurPapier} ${bobineFille.laize}mm ${bobineFille.grammage}g`);
    }
    elements.push(
      <Button onClick={() => this.handleRemoveBobineFille(bobineFille)}>Enlever</Button>
    );
    return (
      <BobineFilleWrapper style={{backgroundColor: getCouleurByName(bobineFille.couleurPapier)}}>
        {elements}
      </BobineFilleWrapper>
    );
  }

  public render(): JSX.Element {
    const {planProd} = this.props;
    const bobines = planProd.planProduction.bobinesFilles;

    return (
      <ProdElementWrapper>
        {bobines.map(bobine => this.renderBobineFille(bobine))}
        {planProd.selectables.selectableBobinesFilles.length > 0 ? (
          <Button onClick={this.handleAddBobineFille}>Ajouter Bobine</Button>
        ) : (
          <React.Fragment />
        )}
      </ProdElementWrapper>
    );
  }
}

const ProdElementWrapper = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  background-color: #ddd;
`;

const BobineFilleWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  font-size: 13px;
  padding: 8px;
`;

const BobineFillePoseSeparator = styled.div`
  width: 80%;
  height: 1px;
  margin: 8px 0;
  background-color: #ddd;
`;
