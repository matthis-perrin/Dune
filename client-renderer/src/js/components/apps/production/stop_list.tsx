import * as React from 'react';
import styled from 'styled-components';

import {StopView} from '@root/components/apps/production/stop_view';
import {Button} from '@root/components/core/button';
import {Closable} from '@root/components/core/closable';
import {bridge} from '@root/lib/bridge';
import {Palette} from '@root/theme';

import {startOfDay, endOfDay} from '@shared/lib/utils';
import {Stop, Schedule, StopType, Maintenance} from '@shared/models';

interface StopListProps {
  schedule: Schedule;
  stops: Stop[];
  lastMinute: number;
}

export class StopList extends React.Component<StopListProps> {
  public static displayName = 'StopList';

  private getNextMaintenance(): Maintenance | undefined {
    const {schedule, stops} = this.props;
    const lastStop = stops[stops.length - 1];
    if (!lastStop || lastStop.end !== undefined) {
      return undefined;
    }

    if (lastStop.maintenanceId !== undefined) {
      return undefined;
    }

    const start = startOfDay(new Date(lastStop.start)).getTime();
    const end = endOfDay(new Date(lastStop.start)).getTime();

    const doneMaintenances = new Map<number, void>();
    schedule.plans.forEach(p =>
      p.schedulePerDay.forEach(s =>
        s.stops.forEach(stop => {
          if (stop.maintenanceId !== undefined) {
            doneMaintenances.set(stop.maintenanceId);
          }
        })
      )
    );

    const todaysMaintenances = schedule.maintenances
      .filter(m => m.start >= start && m.start < end)
      .filter(m => !doneMaintenances.has(m.id))
      .sort((m1, m2) => m1.start - m2.start);

    return todaysMaintenances[0];
  }

  private canStartMaintenance(): number | undefined {
    const nextMaintenance = this.getNextMaintenance();
    if (nextMaintenance) {
      return nextMaintenance.id;
    }
    return undefined;
  }

  private canEndMaintenance(): number | undefined {
    const {stops, lastMinute} = this.props;
    const lastStop = stops[stops.length - 1];
    if (
      !lastStop ||
      lastStop.end !== undefined ||
      lastStop.maintenanceId === undefined ||
      lastMinute === lastStop.start
    ) {
      return undefined;
    }
    return lastStop.maintenanceId;
  }

  private readonly handleStartMaintenanceClick = (): void => {
    const maintenanceId = this.canStartMaintenance();
    if (maintenanceId !== undefined) {
      bridge.startMaintenanceStop(maintenanceId).catch(console.error);
    }
  };

  private readonly handleDeleteMaintenanceClick = (stop: Stop) => (): void => {
    if (stop.maintenanceId !== undefined) {
      bridge.deleteMaintenanceStop(stop.maintenanceId).catch(console.error);
    }
  };

  private readonly handleEndMaintenanceClick = (): void => {
    const maintenanceId = this.canEndMaintenance();
    if (maintenanceId !== undefined) {
      bridge.endMaintenanceStop(maintenanceId).catch(console.error);
    }
  };

  public render(): JSX.Element {
    const {stops, lastMinute} = this.props;
    const sortedStops = stops.sort((s1, s2) => s1.start - s2.start);
    const startMaintenanceId = this.canStartMaintenance();
    const endMaintenanceId = this.canEndMaintenance();

    return (
      <StopsWrapper>
        {sortedStops.map((s, i) => {
          const stopView = (
            <StopViewWrapper>
              <StopView lastMinute={lastMinute} stop={s} />
            </StopViewWrapper>
          );
          const previousStop = sortedStops[i - 1];
          if (
            previousStop &&
            previousStop.end === s.start &&
            s.stopType === StopType.Maintenance &&
            s.end === undefined
          ) {
            return (
              <Closable onClose={this.handleDeleteMaintenanceClick(s)} color={Palette.Asbestos}>
                {stopView}
              </Closable>
            );
          }
          return stopView;
        })}
        {startMaintenanceId !== undefined ? (
          <Button onClick={this.handleStartMaintenanceClick}>Démarrer maintenance</Button>
        ) : (
          <React.Fragment />
        )}
        {endMaintenanceId !== undefined ? (
          <Button onClick={this.handleEndMaintenanceClick}>Fin de maintenance</Button>
        ) : (
          <React.Fragment />
        )}
      </StopsWrapper>
    );
  }
}

const StopsWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;
const StopViewWrapper = styled.div`
  margin-bottom: 6px;
`;
