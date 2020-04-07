import React from 'react';
import styled from 'styled-components';

import {ServiceStatus} from '@shared/models';

interface Props {
  // AP
  gescom: {[key: string]: ServiceStatus};
}

const AGE_MIN_SECONDS = 3;
const AGE_MAX_SECONDS = 2592000; // 30 * 24 * 3600

export class MonitoringGescom extends React.Component<Props> {
  public static displayName = 'Gescom monitoring';

  constructor(props: Props) {
    super(props);
  }

  private agoToString(ago: number): string {
    if (ago < AGE_MIN_SECONDS) {
      return `il y a < ${AGE_MIN_SECONDS}s`;
    }
    if (ago > AGE_MAX_SECONDS) {
      return 'jamais mise a jour';
    }
    if (ago > 3600) {
      return "plus d'une heure";
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
      <tr key={title}>
        <td>
          <ServiceTitle>{title}</ServiceTitle>
        </td>
        <td>
          <ServiceRowCount>{`${nonSommeilCount}${rowCountSuffix}`}</ServiceRowCount>
        </td>
        <td>
          <ServiceLastUpdate>{this.agoToString(lastUpdateAgo / 1000)}</ServiceLastUpdate>
        </td>
      </tr>
    );
  }

  private renderServices(
    services: {name: string; title: string}[],
    servicesStatus: {[key: string]: ServiceStatus}
  ): JSX.Element[] {
    return services.map(({name, title}) => {
      const status = servicesStatus[name] || {
        lastUpdate: 0,
        rowCount: 0,
      };
      return this.renderService(title, status.rowCount, status.rowCountSommeil, status.lastUpdate);
    });
  }

  public render(): JSX.Element {
    const {gescom} = this.props;

    return (
      <table style={{width: '100%', borderCollapse: 'collapse', color: 'white'}}>
        <tbody>
          <tr>
            <td colSpan={3} style={{paddingTop: 16}}>
              <SectionTitle>Gestion commerciale</SectionTitle>
            </td>
          </tr>
          {this.renderServices(
            [
              {name: 'bobines_meres', title: 'Bobines mères'},
              {name: 'cliches', title: 'Clichés'},
              {name: 'bobines_filles', title: 'Bobines filles'},
              {name: 'stocks', title: 'Stocks'},
              {name: 'cadencier', title: 'Cadencier'},
            ],
            gescom
          )}
        </tbody>
      </table>
    );
  }
}

const SectionTitle = styled.div`
  font-weight: 400;
  margin: 8px 0;
  font-size: 22px;
  padding: 4px 16px;
  background: #16a085;
`;

const ServiceTitle = styled.div`
  width: 100%;
  display: inline-block;
  font-weight: 400;
  font-size: 18px;
`;

const ServiceRowCount = styled.div`
  width: 100%;
  display: inline-block;
  text-align: right;
`;

const ServiceLastUpdate = styled.div`
  width: 100%;
  display: inline-block;
  text-align: right;
`;
