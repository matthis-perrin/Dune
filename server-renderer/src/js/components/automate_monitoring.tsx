import React from 'react';
import styled from 'styled-components';

import {AutomateStatus} from '@shared/models';

interface Props {
  // AP
  automate: AutomateStatus;
  automateName: string;
}

export class AutomateMonitoring extends React.Component<Props> {
  public static displayName = 'AutomateMonitoring';

  constructor(props: Props) {
    super(props);
  }

  private formatPreciseTime(time: number): string {
    // tslint:disable:no-magic-numbers
    const date = new Date(time);
    const hours = `0${date.getHours()}`.slice(-2);
    const minutes = `0${date.getMinutes()}`.slice(-2);
    const seconds = `0${date.getSeconds()}`.slice(-2);
    const milliseconds = `00${date.getMilliseconds()}`.slice(-3);
    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
    // tslint:enable:no-magic-numbers
  }

  public render(): JSX.Element {
    const {automate, automateName} = this.props;

    const {
      lastMinute,
      firstMinute,
      rowCount,
      lastStop = {start: undefined, end: undefined},
      lastReceived,
    } = automate;

    return (
      <table style={{width: '100%', borderCollapse: 'collapse', color: 'white'}}>
        <tbody>
          <tr>
            <td colSpan={3}>
              <SectionTitle>Automate retour {automateName}</SectionTitle>
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
        </tbody>
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
