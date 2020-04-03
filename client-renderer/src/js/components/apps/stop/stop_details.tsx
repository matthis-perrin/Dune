import React from 'react';
import styled from 'styled-components';

import {Select, Option} from '@root/components/core/select';
import {SVGIcon} from '@root/components/core/svg_icon';
import {getPlanProdTitle} from '@root/lib/plan_prod';
import {getColorForStopType, getLabelForStopType} from '@root/lib/stop';
import {Palette} from '@root/theme';

import {
  Stop,
  StopType,
  UnplannedStop,
  Cleaning,
  ScheduledPlanProd,
  Maintenance,
} from '@shared/models';

interface StopDetailsProps {
  stop: Stop;
  type?: StopType;
  unplannedStops: UnplannedStop[];
  comments: string[];
  cleanings: Cleaning[];
  planProdId?: number;
  maintenanceId?: number;
  availablePlanProds: ScheduledPlanProd[];
  availableMaintenances: Maintenance[];
  onRemoveType(): void;
  onRemoveUnplannedStop(name: string): void;
  onRemoveCleaning(name: string): void;
  onRemoveComment(index: number): void;
  onPlanProdIdChanged(newPlanProdId: number): void;
  onMaintenanceIdChanged(newMaintenanceId: number): void;
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

  private renderLine(
    title: string,
    color: string,
    handleClose: () => void,
    rightElement?: JSX.Element
  ): JSX.Element {
    return (
      <ListLineWrapper style={{backgroundColor: color}}>
        <ListLineTitle>{title}</ListLineTitle>
        <ListLineRight>{rightElement}</ListLineRight>
        <ListLineRemove onClick={handleClose}>
          <SVGIcon name="cross" width={12} height={12} />
        </ListLineRemove>
      </ListLineWrapper>
    );
  }

  private renderPlanProdForm(selectedPlanProdId: number): JSX.Element {
    const {availablePlanProds, onPlanProdIdChanged} = this.props;
    return (
      <PlanProdSelect
        onChange={event => onPlanProdIdChanged(parseFloat(event.target.value))}
        value={selectedPlanProdId}
      >
        {availablePlanProds.map(p => (
          <PlanProdOption key={p.planProd.id} value={p.planProd.id}>{getPlanProdTitle(p.planProd.id)}</PlanProdOption>
        ))}
      </PlanProdSelect>
    );
  }

  private renderMaintenanceForm(selectedMaintenanceId: number): JSX.Element {
    const {availableMaintenances, onMaintenanceIdChanged} = this.props;
    return (
      <MaintenanceSelect
        onChange={event => onMaintenanceIdChanged(parseFloat(event.target.value))}
        value={selectedMaintenanceId}
      >
        {availableMaintenances.map(m => (
          <MaintenanceOption key={m.id} value={m.id}>{m.title}</MaintenanceOption>
        ))}
      </MaintenanceSelect>
    );
  }

  private renderType(type: StopType): JSX.Element {
    const {maintenanceId, planProdId} = this.props;
    let rightForm = <React.Fragment />;
    if (planProdId !== undefined && type === StopType.ChangePlanProd) {
      rightForm = this.renderPlanProdForm(planProdId);
    }
    if (maintenanceId !== undefined && type === StopType.Maintenance) {
      rightForm = this.renderMaintenanceForm(maintenanceId);
    }
    return this.renderLine(
      getLabelForStopType(type, type === StopType.Maintenance ? 'Maintenance' : undefined),
      getColorForStopType(type),
      this.props.onRemoveType,
      rightForm
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
    const {type, unplannedStops, comments, cleanings} = this.props;
    if (!type) {
      return <Wrapper>{this.renderEmpty()}</Wrapper>;
    }
    return (
      <Wrapper>
        {this.renderType(type)}
        {unplannedStops
          .sort((r1, r2) => r1.order - r2.order)
          .map(r => this.renderUnplannedStop(r))}
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

const ListLineWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-top: 4px;
`;

const ListLineTitle = styled.div`
  flex-grow: 1;
  margin-left: 8px;
`;

const ListLineRight = styled.div`
  flex-shrink: 0;
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

const PlanProdSelect = styled(Select)`
  padding: 0px 2px;
`;

const PlanProdOption = styled(Option)``;

const MaintenanceSelect = styled(Select)`
  padding: 0px 2px;
`;

const MaintenanceOption = styled(Option)``;
