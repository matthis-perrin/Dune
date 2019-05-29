import * as React from 'react';
import styled from 'styled-components';

import {ServiceStatus} from '@shared/models';

interface Props {
  mondon: {[key: string]: ServiceStatus};
  gescom: {[key: string]: ServiceStatus};
}

export class Monitoring extends React.Component<Props> {
  public static displayName = 'Monitoring';

  constructor(props: Props) {
    super(props);
  }

  private agoToString(ago: number): string {
    if (ago < 2) {
      return 'il y a < 2s';
    }
    if (ago > 3600) {
      return 'Jamais mise a jour';
    }
    return `il y a ${Math.round(ago)}s`;
  }

  private renderService(
    title: string,
    rowCount: number,
    rowCountSommeil: number | undefined,
    lastUpdate: number
  ): JSX.Element {
    const lastUpdateAgo = Date.now() - lastUpdate;
    const nonSommeilCount = rowCount - (rowCountSommeil || 0);
    const rowCountSuffix = rowCountSommeil === undefined ? '' : ` / ${rowCount}`;

    return (
      <ServiceWrapper key={title}>
        <ServiceTitle>{title}</ServiceTitle>
        <ServiceRowCount>{`${nonSommeilCount}${rowCountSuffix}`}</ServiceRowCount>
        <ServiceLastUpdate>{this.agoToString(lastUpdateAgo / 1000)}</ServiceLastUpdate>
      </ServiceWrapper>
    );
  }

  private renderSection(
    sectionTitle: string,
    services: {name: string; title: string}[],
    servicesStatus: {[key: string]: ServiceStatus}
  ): JSX.Element {
    const servicesElements: JSX.Element[] = services.map(({name, title}) => {
      const status = servicesStatus[name] || {
        lastUpdate: 0,
        rowCount: 0,
      };
      return this.renderService(title, status.rowCount, status.rowCountSommeil, status.lastUpdate);
    });
    return (
      <SectionWrapper>
        <SectionTitle>{sectionTitle}</SectionTitle>
        {servicesElements}
      </SectionWrapper>
    );
  }

  public render(): JSX.Element {
    const {mondon, gescom} = this.props;
    return (
      <div>
        {this.renderSection('Automate', [{name: 'speed', title: 'Vitesse'}], mondon)}
        {this.renderSection(
          'Gestion commerciale',
          [
            {name: 'bobines_meres', title: 'Bobines mères'},
            {name: 'cliches', title: 'Clichés'},
            {name: 'bobines_filles', title: 'Bobines filles'},
            {name: 'stocks', title: 'Stocks'},
            {name: 'cadencier', title: 'Cadencier'},
          ],
          gescom
        )}
      </div>
    );
  }
}

const SectionWrapper = styled.div`
  margin-bottom: 22px;
`;

const SectionTitle = styled.div`
  font-weight: 600;
  display: inline-block;
  margin-bottom: 8px;
  font-size: 22px;
`;

const ServiceWrapper = styled.div``;

const ServiceTitle = styled.div`
  display: inline-block;
  font-weight: 600;
  width: 130px;
  font-size: 18px;
`;

const ServiceRowCount = styled.div`
  display: inline-block;
  width: 120px;
  text-align: right;
`;

const ServiceLastUpdate = styled.div`
  display: inline-block;
  width: calc(100% - 250px);
  text-align: right;
`;
