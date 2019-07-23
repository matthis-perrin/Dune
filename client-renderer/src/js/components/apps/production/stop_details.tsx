import * as React from 'react';
import styled from 'styled-components';

import {SVGIcon} from '@root/components/core/svg_icon';
import {colorForStopType, labelForStopType} from '@root/lib/stop';
import {Palette, theme, Colors} from '@root/theme';

import {Stop, StopType, UnplannedStop, Cleaning} from '@shared/models';

interface StopDetailsProps {
  stop: Stop;
  type?: StopType;
  unplannedStops: UnplannedStop[];
  comments: string[];
  cleanings: Cleaning[];
  planProdId?: string;
  maintenanceId?: string;
  onRemoveUnplannedStop(name: string): void;
  onRemoveComment(index: number): void;
  // ...
}

export class StopDetails extends React.Component<StopDetailsProps> {
  public static displayName = 'StopDetails';

  private readonly handleRemove = (name: string) => () => {
    this.props.onRemoveUnplannedStop(name);
  };

  public renderEmpty(): JSX.Element {
    return <EmptyDetails>non renseigné</EmptyDetails>;
  }

  private renderUnplannedStop(unplannedStop: UnplannedStop): JSX.Element {
    return (
      <UnplannedStopWrapper>
        <UnplannedStopTitle>{`${unplannedStop.group} : ${unplannedStop.label}`}</UnplannedStopTitle>
        <UnplannedStopRemove onClick={this.handleRemove(unplannedStop.name)}>
          <SVGIcon name="cross" width={12} height={12} />
        </UnplannedStopRemove>
      </UnplannedStopWrapper>
    );
  }

  public render(): JSX.Element {
    const {type, unplannedStops, comments, cleanings, planProdId, maintenanceId} = this.props;
    if (!type) {
      return <Wrapper>{this.renderEmpty()}</Wrapper>;
    }
    return (
      <Wrapper>
        <TypeBar style={{backgroundColor: colorForStopType.get(type)}}>
          {labelForStopType.get(type)}
        </TypeBar>
        {unplannedStops.sort((r1, r2) => r1.order - r2.order).map(r => this.renderUnplannedStop(r))}
      </Wrapper>
    );
  }
}

const Wrapper = styled.div`
  width: 100%;
  min-height: 128px;
  box-sizing: border-box;
`;

const TypeBar = styled.div`
  width: 100%;
  box-sizing: border-box;
  padding: 4px 8px;
`;

const UnplannedStopWrapper = styled.div`
  display: flex;
  align-items: center;
  background-color: ${Palette.Asbestos};
  margin-top: 4px;
`;

const UnplannedStopTitle = styled.div`
  flex-grow: 1;
  margin-left: 8px;
`;

const UnplannedStopRemove = styled.div`
  flex-shrink: 0;
  padding: 4px 8px;
  cursor: pointer;
  & > svg {
    fill: ${Colors.Danger};
  }
  &:hover > svg {
    fill: ${Colors.DangerLight};
  }
`;

const EmptyDetails = styled.div`
  width: 100%;
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-style: italic;
`;
