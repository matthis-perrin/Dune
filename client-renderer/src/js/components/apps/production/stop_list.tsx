import {uniqBy} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {StopView} from '@root/components/apps/production/stop_view';
import {Button} from '@root/components/core/button';
import {bridge} from '@root/lib/bridge';

import {Stop, StopInfo} from '@shared/models';

interface StopListProps {
  stops: Stop[];
  lastMinute: number;
}

export class StopList extends React.Component<StopListProps> {
  public static displayName = 'StopList';

  private readonly handleNewStopClick = (): void => {
    const {lastMinute, stops} = this.props;
    const lastStop = stops[0];
    if (lastStop) {
      bridge.createStop(lastStop.start, lastMinute);
    }
  };

  private mergeStopInfo(
    info1: StopInfo | undefined,
    info2: StopInfo | undefined
  ): StopInfo | undefined {
    if (!info1) {
      return info2;
    }
    if (!info2) {
      return info1;
    }
    return {
      cleanings: uniqBy(info1.cleanings.concat(info2.cleanings), c => c.name),
      comments: info1.comments.concat(info2.comments),
      unplannedStops: uniqBy(info1.unplannedStops.concat(info2.unplannedStops), c => c.name),
    };
  }

  private merge(stop1: Stop, stop2: Stop): void {
    if (stop2.end === undefined) {
      return;
    }
    const mergedInfo = this.mergeStopInfo(stop1.stopInfo, stop2.stopInfo) || {
      cleanings: [],
      comments: [],
      unplannedStops: [],
    };
    bridge.mergeStops(stop1.start, stop2.start, mergedInfo, stop1.end);
  }

  private canCreateNewStop(): boolean {
    const {lastMinute, stops} = this.props;
    const lastStop = stops[0];
    return lastStop !== undefined && lastStop.end === undefined && lastStop.start !== lastMinute;
  }

  private groupStops(): Stop[][] {
    const {stops} = this.props;
    const groups: Stop[][] = [];
    stops.forEach(s => {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup === undefined) {
        groups.push([s]);
      } else {
        const lastStopOfLastGroup = lastGroup[lastGroup.length - 1];
        if (lastStopOfLastGroup === undefined) {
          lastGroup.push(s);
        } else {
          if (lastStopOfLastGroup.end === s.start) {
            lastGroup.push(s);
          } else {
            groups.push([s]);
          }
        }
      }
    });
    return groups;
  }

  private renderMergeButton(stop1: Stop, stop2: Stop): JSX.Element {
    return <MergeButton onClick={() => this.merge(stop1, stop2)}>↑ Fusionner ↑</MergeButton>;
  }

  private renderStopGroup(stopGroup: Stop[]): JSX.Element {
    const {lastMinute} = this.props;
    const stopViews: JSX.Element[] = [];
    stopGroup.forEach((stop, i) => {
      if (i > 0) {
        const previousStop = stopGroup[i - 1];
        stopViews.push(this.renderMergeButton(previousStop, stop));
      }
      stopViews.push(<StopView lastMinute={lastMinute} stop={stop} />);
    });

    return <StopGroup>{stopViews}</StopGroup>;
  }

  public render(): JSX.Element {
    const stopGroups = this.groupStops();
    return (
      <StopsWrapper>
        <Button onClick={this.handleNewStopClick} disabled={!this.canCreateNewStop()}>
          Nouvel Arrêt
        </Button>
        {stopGroups.map(g => this.renderStopGroup(g))}
      </StopsWrapper>
    );
  }
}

const StopsWrapper = styled.div``;
const StopGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 6px;
`;
const MergeButton = styled(Button)`
  position: relative;
  height: 31px;
  padding: 2px 16px;
  margin: -15px 0;
`;
