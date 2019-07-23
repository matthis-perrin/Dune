import * as React from 'react';
import styled from 'styled-components';

import {SVGIcon} from '@root/components/core/svg_icon';
import {colorForStopType, labelForStopType} from '@root/lib/stop';
import {Palette, Colors} from '@root/theme';

import {Stop, StopType, UnplannedStop, Cleaning} from '@shared/models';

interface StopDetailsProps {
  stop: Stop;
  type?: StopType;
  unplannedStops: UnplannedStop[];
  comments: string[];
  cleanings: Cleaning[];
  planProdId?: string;
  maintenanceId?: string;
  onRemoveType(): void;
  onRemoveUnplannedStop(name: string): void;
  onRemoveCleaning(name: string): void;
  onRemoveComment(index: number): void;
}

export class StopDetails extends React.Component<StopDetailsProps> {
  public static displayName = 'StopDetails';

  private readonly handleRemoveUnplannedStop = (name: string) => () => {
    this.props.onRemoveUnplannedStop(name);
  };

  private readonly handleRemoveCleaning = (name: string) => () => {
    this.props.onRemoveCleaning(name);
  };

  private readonly handleRemoveComment = (index: number) => () => {
    this.props.onRemoveComment(index);
  };

  public renderEmpty(): JSX.Element {
    return <EmptyDetails>non renseigné</EmptyDetails>;
  }

  private renderLine(title: string, color: string, handleClose: () => void): JSX.Element {
    return (
      <ListLineWrapper style={{backgroundColor: color}}>
        <ListLineTitle>{title}</ListLineTitle>
        <ListLineRemove onClick={handleClose}>
          <SVGIcon name="cross" width={12} height={12} />
        </ListLineRemove>
      </ListLineWrapper>
    );
  }

  private renderType(type: StopType): JSX.Element {
    return this.renderLine(
      labelForStopType.get(type) || '',
      colorForStopType.get(type) || 'white',
      this.props.onRemoveType
    );
  }

  private renderUnplannedStop(unplannedStop: UnplannedStop): JSX.Element {
    return this.renderLine(
      `${unplannedStop.group} : ${unplannedStop.label}`,
      Palette.Asbestos,
      this.handleRemoveUnplannedStop(unplannedStop.name)
    );
  }

  private renderComment(comment: string, index: number): JSX.Element {
    return this.renderLine(
      `Commentaire : ${comment}`,
      Palette.Asbestos,
      this.handleRemoveComment(index)
    );
  }

  private renderCleaning(cleaning: Cleaning): JSX.Element {
    return this.renderLine(
      `Nettoyage : ${cleaning.label}`,
      Palette.Asbestos,
      this.handleRemoveCleaning(cleaning.name)
    );
  }

  public render(): JSX.Element {
    const {type, unplannedStops, comments, cleanings, planProdId, maintenanceId} = this.props;
    if (!type) {
      return <Wrapper>{this.renderEmpty()}</Wrapper>;
    }
    return (
      <Wrapper>
        {this.renderType(type)}
        {unplannedStops.sort((r1, r2) => r1.order - r2.order).map(r => this.renderUnplannedStop(r))}
        {comments.map((comment, index) => this.renderComment(comment, index))}
        {cleanings.sort((c1, c2) => c1.order - c2.order).map(c => this.renderCleaning(c))}
      </Wrapper>
    );
  }
}

const Wrapper = styled.div`
  width: 100%;
  box-sizing: border-box;
`;

const TypeBar = styled.div`
  width: 100%;
  box-sizing: border-box;
  padding: 4px 8px;
`;

const ListLineWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-top: 4px;
`;

const ListLineTitle = styled.div`
  flex-grow: 1;
  margin-left: 8px;
`;

const ListLineRemove = styled.div`
  flex-shrink: 0;
  padding: 4px 8px;
  cursor: pointer;
  & > svg {
    fill: ${Palette.White};
  }
  &:hover > svg {
    fill: ${Palette.Clouds};
  }
`;

const EmptyDetails = styled.div`
  width: 100%;
  padding: 16px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-style: italic;
`;
