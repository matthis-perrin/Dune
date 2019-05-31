import * as React from 'react';
import styled from 'styled-components';

import {Button} from '@root/components/core/button';
import {SizeMonitor} from '@root/components/core/size_monitor';
import {FilterableTable} from '@root/components/table/filterable_table';
import {getPerfoColumns} from '@root/components/table/table_columns';
import {PlanProductionEngine} from '@root/lib/plan_production/engine';
import {appStore} from '@root/stores/app_store';
import {theme} from '@root/theme/default';

import {Perfo} from '@shared/models';

interface Props {
  planProd: PlanProductionEngine;
}

export class PlanProductionPerfo extends React.Component<Props> {
  public static displayName = 'PlanProductionPerfo';

  private shouldShow(perfo: Perfo, isSelectionnable: boolean): boolean {
    const index = this.props.planProd.selectables.selectablePerfos
      .map(p => p.ref)
      .indexOf(perfo.ref);
    return isSelectionnable ? index !== -1 : index === -1;
  }

  private readonly shouldShowSelectionnableRow = (perfo: Perfo, enabled: boolean): boolean => {
    return enabled && this.shouldShow(perfo, true);
  };

  private readonly shouldShowNonSelectionnableRow = (perfo: Perfo, enabled: boolean): boolean => {
    return enabled && this.shouldShow(perfo, false);
  };

  private readonly handleAddPerfo = (): void => {
    const {planProd} = this.props;
    const perfoTable = (
      <SizeMonitor>
        {(width, height) => {
          const modalPadding = 2 * theme.modal.margin + 2 * theme.modal.padding;
          const tableBorderNumber = 3;
          return (
            <FilterableTable
              data={planProd.allPerfos}
              lastUpdate={0}
              columns={getPerfoColumns()}
              initialSort={{
                columnName: 'ref',
                asc: true,
              }}
              onSelected={(perfo: Perfo) => {
                planProd.setPerfo(perfo);
                this.forceUpdate();
                appStore.closeModal();
              }}
              title="perfo"
              filters={[
                {
                  enableByDefault: true,
                  title: 'Perfos sélectionnables',
                  shouldShowRow: this.shouldShowSelectionnableRow,
                },
                {
                  enableByDefault: false,
                  title: 'Perfos non-sélectionnables',
                  shouldShowRow: this.shouldShowNonSelectionnableRow,
                },
              ]}
              isRowDisabled={perfo =>
                planProd.selectables.selectablePerfos.map(p => p.ref).indexOf(perfo.ref) === -1
              }
              width={width - modalPadding - tableBorderNumber * theme.table.borderThickness}
              height={height - modalPadding}
            />
          );
        }}
      </SizeMonitor>
    );
    appStore.openModal(perfoTable);
  };

  private readonly handleRemovePerfo = (): void => {
    this.props.planProd.setPerfo(undefined);
  };

  private renderDecalage(size: number | undefined): JSX.Element {
    return <Decalage>{`Décalage de ${size || 0}`}</Decalage>;
  }

  private renderCale(size: number | undefined, index: number): JSX.Element {
    return <Cale>{`Cale ${index} (${size || 0})`}</Cale>;
  }

  private renderBague(size: number | undefined, index: number): JSX.Element {
    return <Bague>{`Bague ${index} (${size || 0})`}</Bague>;
  }

  private renderPerfo(perfo: Perfo): JSX.Element {
    const elements: JSX.Element[] = [
      this.renderDecalage(perfo.decalageInitial),
      // tslint:disable:no-magic-numbers
      this.renderCale(perfo.cale1, 1),
      this.renderBague(perfo.bague1, 1),
      this.renderCale(perfo.cale2, 2),
      this.renderBague(perfo.bague2, 2),
      this.renderCale(perfo.cale3, 3),
      this.renderBague(perfo.bague3, 3),
      this.renderCale(perfo.cale4, 4),
      this.renderBague(perfo.bague4, 4),
      this.renderCale(perfo.cale5, 5),
      this.renderBague(perfo.bague5, 5),
      this.renderCale(perfo.cale6, 6),
      this.renderBague(perfo.bague6, 6),
      this.renderCale(perfo.cale7, 7),
      this.renderBague(perfo.bague7, 7),
      // tslint:enable:no-magic-numbers
    ];

    return <PerfoWrapper>{elements}</PerfoWrapper>;
  }

  public render(): JSX.Element {
    const {planProd} = this.props;
    const perfo = planProd.planProduction.perfo;

    return (
      <ProdElementWrapper>
        {perfo ? (
          <React.Fragment>
            {this.renderPerfo(perfo)}
            <Button onClick={this.handleRemovePerfo}>Enlever Perfo</Button>
          </React.Fragment>
        ) : (
          <Button onClick={this.handleAddPerfo}>Selection Perfo</Button>
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

const PerfoWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const PerfoElement = styled.div`
  display: flex;
  align-item: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 500;
  background-color: #c0c0c0;
`;

const Decalage = styled(PerfoElement)`
  width: 120px;
  padding: 12px 0;
`;

const Cale = styled(PerfoElement)`
  width: 80px;
  padding: 4px 0;
  margin-top: 8px;
`;

const Bague = styled(PerfoElement)`
  width: 120px;
  padding: 8px 0;
  margin-top: 8px;
`;
