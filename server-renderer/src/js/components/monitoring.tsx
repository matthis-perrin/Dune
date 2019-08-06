import * as React from 'react';
import styled from 'styled-components';

import {ServiceStatus, AutomateStatus} from '@shared/models';

interface Props {
  automate: AutomateStatus;
  gescom: {[key: string]: ServiceStatus};
}

export class Monitoring extends React.Component<Props> {
  public static displayName = 'Monitoring';

  constructor(props: Props) {
    super(props);
  }

  private agoToString(ago: number): string {
    if (ago < 3) {
      return 'il y a < 3s';
    }
    if (ago > 3600) {
      return 'Jamais mise a jour';
    }
    return `il y a ${Math.round(ago)}s`;
  }

  private formatPreciseTime(time: number): string {
    const date = new Date(time);
    const hours = `0${date.getHours()}`.slice(-2);
    const minutes = `0${date.getMinutes()}`.slice(-2);
    const seconds = `0${date.getSeconds()}`.slice(-2);
    const milliseconds = `00${date.getMilliseconds()}`.slice(-3);
    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
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
    const {automate, gescom} = this.props;

    const {
      lastMinute,
      firstMinute,
      rowCount,
      lastStop = {start: undefined, end: undefined},
      lastReceived,
    } = automate;

    return (
      <table style={{width: '100%', borderCollapse: 'collapse', color: 'white'}}>
        <tr>
          <td colSpan={3}>
            <SectionTitle>Automate</SectionTitle>
          </td>
        </tr>
        <tr>
          <td>
            <ServiceTitle>Dernière vitesse reçue</ServiceTitle>
          </td>
          <td>
            <ServiceRowCount>
              {lastReceived
                ? `${lastReceived.speed} (${this.formatPreciseTime(lastReceived.time)})`
                : '-'}
            </ServiceRowCount>
          </td>
          <td />
        </tr>
        <tr>
          <td>
            <ServiceTitle>Vitesse dernier temps</ServiceTitle>
          </td>
          <td>
            <ServiceRowCount>{lastMinute ? lastMinute.speed : '-'}</ServiceRowCount>
          </td>
          <td />
        </tr>
        <tr>
          <td>
            <ServiceTitle>Dernier temps</ServiceTitle>
          </td>
          <td>
            <ServiceRowCount>
              {lastMinute ? new Date(lastMinute.time).toLocaleString('fr') : '-'}
            </ServiceRowCount>
          </td>
          <td />
        </tr>
        <tr>
          <td>
            <ServiceTitle>Première temps</ServiceTitle>
          </td>
          <td>
            <ServiceRowCount>
              {firstMinute ? new Date(firstMinute.time).toLocaleString('fr') : '-'}
            </ServiceRowCount>
          </td>
          <td />
        </tr>
        <tr>
          <td>
            <ServiceTitle>Nombre de vitesse</ServiceTitle>
          </td>
          <td>
            <ServiceRowCount>{rowCount.toLocaleString('fr')}</ServiceRowCount>
          </td>
          <td />
        </tr>
        <tr>
          <td rowSpan={2}>
            <ServiceTitle>Dernier Arrêt</ServiceTitle>
          </td>
          <td>
            <ServiceRowCount>{`Début : ${
              lastStop.start ? new Date(lastStop.start).toLocaleString('fr') : 'Aucun'
            }`}</ServiceRowCount>
          </td>
          <td />
        </tr>
        <tr>
          <td>
            <ServiceRowCount>
              {lastStop.end ? `Fin : ${new Date(lastStop.end).toLocaleString('fr')}` : 'En cours'}
            </ServiceRowCount>
          </td>
          <td />
        </tr>

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
      </table>
    );
  }
}

const SectionTitle = styled.div`
  font-weight: 400;
  display: inline-block;
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
