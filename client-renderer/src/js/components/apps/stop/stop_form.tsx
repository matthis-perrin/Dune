import React from 'react';
import styled from 'styled-components';

import {CleaningsForm} from '@root/components/apps/stop/cleanings_form';
import {StopCommentForm} from '@root/components/apps/stop/stop_comment_form';
import {StopDetails} from '@root/components/apps/stop/stop_details';
import {UnplannedStopsForm} from '@root/components/apps/stop/stop_other_reasons_form';
import {StopTypeForm} from '@root/components/apps/stop/stop_type_form';
import {Timer} from '@root/components/common/timer';
import {Button} from '@root/components/core/button';
import {bridge} from '@root/lib/bridge';
import {
  getAllPlannedSchedules,
  getAllPlannedMaintenances,
  getMaintenance,
  getPlanProd,
  getPreviousStop,
  getCurrentPlanSchedule,
} from '@root/lib/schedule_utils';
import {Palette, Colors} from '@root/theme';

import {
  Stop,
  StopType,
  UnplannedStop,
  Cleaning,
  Schedule,
  ScheduledPlanProd,
  Maintenance,
} from '@shared/models';

interface StopFormProps {
  stop: Stop;
  schedule: Schedule;
}

interface StopFormState {
  stopType?: StopType;
  unplannedStops: UnplannedStop[];
  cleanings: Cleaning[];
  comments: string[];
  planProdId?: number;
  maintenanceId?: number;
}

export class StopForm extends React.Component<StopFormProps, StopFormState> {
  public static displayName = 'StopForm';

  public constructor(props: StopFormProps) {
    super(props);
    const {stop} = props;
    const {stopInfo, stopType, planProdId, maintenanceId} = stop;
    if (!stopInfo) {
      this.state = {
        stopType: stop.stopType,
        unplannedStops: [],
        cleanings: [],
        comments: [],
        planProdId,
        maintenanceId,
      };
    } else {
      const {unplannedStops, cleanings, comments} = stopInfo;
      this.state = {
        stopType,
        unplannedStops,
        cleanings,
        comments,
        planProdId,
        maintenanceId,
      };
    }
  }

  private readonly handleSave = (): void => {
    const {stop} = this.props;
    const {stopType, unplannedStops, cleanings, comments, planProdId, maintenanceId} = this.state;
    if (stopType !== undefined && planProdId !== undefined) {
      bridge
        .updateStop(
          stop.start,
          stopType,
          {
            cleanings,
            comments,
            unplannedStops,
          },
          planProdId,
          stopType === StopType.Maintenance ? maintenanceId : undefined
        )
        .then(() => bridge.closeApp().catch(console.error))
        .catch(console.error);
    }
  };

  private readonly handleStopTypeChange = (
    newType: StopType,
    newPlanProdId: number,
    newMaintenanceId?: number
  ): void => {
    this.setState({stopType: newType, planProdId: newPlanProdId, maintenanceId: newMaintenanceId});
  };

  private readonly handleOtherReasonsChanged = (newOtherReasons: UnplannedStop[]): void => {
    this.setState({unplannedStops: newOtherReasons});
  };

  private readonly handleCleaningsChanged = (newCleanings: Cleaning[]): void => {
    this.setState({cleanings: newCleanings});
  };

  private readonly handleRemoveType = (): void => {
    this.setState({stopType: undefined});
  };

  private readonly handleRemoveUnplannedStop = (name: string): void => {
    this.setState({unplannedStops: this.state.unplannedStops.filter(s => s.name !== name)});
  };

  private readonly handleRemoveCleaning = (name: string): void => {
    this.setState({cleanings: this.state.cleanings.filter(s => s.name !== name)});
  };

  private readonly handleRemoveComment = (index: number): void => {
    this.setState({comments: this.state.comments.filter((_, i) => i !== index)});
  };

  private readonly handleCommentAdded = (newComment: string): void => {
    this.setState({comments: this.state.comments.concat([newComment])});
  };

  private readonly handlePlanProdIdChanged = (newPlanProdId: number): void => {
    this.setState({planProdId: newPlanProdId});
  };

  private readonly handleMaintenanceIdChanged = (newMaintenanceId: number): void => {
    this.setState({maintenanceId: newMaintenanceId});
  };

  private formatTime(time?: number): string {
    return time === undefined ? 'en cours' : new Date(time).toLocaleTimeString('fr');
  }

  private getAvailablePlanProds(): ScheduledPlanProd[] {
    const {schedule, stop} = this.props;
    const availablePlanProds = getAllPlannedSchedules(schedule);
    if (stop.planProdId !== undefined && stop.stopType === StopType.ChangePlanProd) {
      const planProd = getPlanProd(schedule, stop.planProdId);
      if (
        planProd &&
        availablePlanProds.map(p => p.planProd.id).indexOf(planProd.planProd.id) === -1
      ) {
        availablePlanProds.unshift(planProd);
      }
    }
    return availablePlanProds;
  }

  private getAvailableMaintenances(): Maintenance[] {
    const {schedule, stop} = this.props;
    const availableMaintenances = getAllPlannedMaintenances(schedule);
    if (stop.maintenanceId !== undefined && stop.stopType === StopType.Maintenance) {
      const maintenance = getMaintenance(schedule, stop.maintenanceId);
      if (maintenance && availableMaintenances.map(m => m.id).indexOf(maintenance.id) === -1) {
        availableMaintenances.unshift(maintenance);
      }
    }
    return availableMaintenances;
  }

  private renderHeader(): JSX.Element {
    const {schedule, stop} = this.props;
    let end = stop.end;
    if (end === undefined && schedule.lastSpeedTime !== undefined) {
      end = schedule.lastSpeedTime.time;
    }
    return (
      <Header>
        <HeaderLeft>
          <HeaderLeftStart>
            <HeaderLeftLabel>DÉBUT</HeaderLeftLabel>
            <HeaderLeftTimeValue>{this.formatTime(stop.start)}</HeaderLeftTimeValue>
          </HeaderLeftStart>
          <HeaderLeftEnd>
            <HeaderLeftLabel>FIN</HeaderLeftLabel>
            <HeaderLeftTimeValue>{this.formatTime(stop.end)}</HeaderLeftTimeValue>
          </HeaderLeftEnd>
        </HeaderLeft>
        <HeaderCenter>ARRÊT</HeaderCenter>
        <HeaderRight>
          <Timer start={stop.start} end={end} />
        </HeaderRight>
      </Header>
    );
  }

  private renderSummary(): JSX.Element {
    const {stop} = this.props;
    const {stopType, unplannedStops, cleanings, comments, planProdId, maintenanceId} = this.state;
    if (stopType === undefined) {
      return <React.Fragment />;
    }
    const availablePlanProds = this.getAvailablePlanProds();
    const availableMaintenances = this.getAvailableMaintenances();

    return (
      <SummaryWrapper>
        <ContentBlock>
          <ContentTitle>RÉSUMÉ DE L'ARRÊT</ContentTitle>
          <ContentInside>
            <StopDetails
              stop={stop}
              type={stopType}
              unplannedStops={unplannedStops}
              cleanings={cleanings}
              comments={comments}
              planProdId={planProdId}
              availablePlanProds={availablePlanProds}
              maintenanceId={maintenanceId}
              availableMaintenances={availableMaintenances}
              onRemoveType={this.handleRemoveType}
              onRemoveUnplannedStop={this.handleRemoveUnplannedStop}
              onRemoveComment={this.handleRemoveComment}
              onRemoveCleaning={this.handleRemoveCleaning}
              onPlanProdIdChanged={this.handlePlanProdIdChanged}
              onMaintenanceIdChanged={this.handleMaintenanceIdChanged}
            />
          </ContentInside>
        </ContentBlock>
      </SummaryWrapper>
    );
  }

  private renderStopType(): JSX.Element {
    const {stop, schedule} = this.props;
    const {stopType} = this.state;
    const availablePlanProds = this.getAvailablePlanProds();
    const availableMaintenances = this.getAvailableMaintenances();
    const currentPlanSchedule = getCurrentPlanSchedule(schedule);
    const prods =
      currentPlanSchedule === undefined
        ? []
        : currentPlanSchedule.prods.concat(currentPlanSchedule.plannedProds);
    const prodsBeforeStop = prods.filter(p => p.start < stop.start);
    const hadProd = prodsBeforeStop.length > 0;
    const currentPlanId = currentPlanSchedule && currentPlanSchedule.planProd.id;
    const previousStop = getPreviousStop(schedule, stop);

    return (
      <StopTypeBlock>
        <ContentTitle>TYPE D'ARRÊT</ContentTitle>
        <ContentInside>
          <StopTypeForm
            stop={stop}
            type={stopType}
            previousStop={previousStop}
            hadProd={hadProd}
            lastPlanId={currentPlanId}
            availablePlanProds={availablePlanProds}
            availableMaintenances={availableMaintenances}
            onChange={this.handleStopTypeChange}
          />
        </ContentInside>
      </StopTypeBlock>
    );
  }

  private renderUnplannedStops(): JSX.Element {
    const {stop} = this.props;
    const {unplannedStops, stopType} = this.state;
    if (stopType === undefined || stopType !== StopType.Unplanned) {
      return <React.Fragment />;
    }
    return (
      <UnplannedStopsBlock>
        <ContentTitle>RAISONS</ContentTitle>
        <ContentInside>
          <UnplannedStopsForm
            stop={stop}
            unplannedStops={unplannedStops}
            onChange={this.handleOtherReasonsChanged}
          />
        </ContentInside>
      </UnplannedStopsBlock>
    );
  }

  private renderCleanings(): JSX.Element {
    const {stop} = this.props;
    const {cleanings, stopType} = this.state;
    if (stopType === undefined) {
      return <React.Fragment />;
    }
    return (
      <CleaningBlock>
        <ContentTitle>NETTOYAGES</ContentTitle>
        <ContentInside>
          <CleaningsForm stop={stop} cleanings={cleanings} onChange={this.handleCleaningsChanged} />
        </ContentInside>
      </CleaningBlock>
    );
  }

  private renderComments(): JSX.Element {
    const {stop} = this.props;
    const {stopType} = this.state;
    if (stopType === undefined) {
      return <React.Fragment />;
    }
    return (
      <CommentBlock>
        <ContentInside>
          <StopCommentForm stop={stop} onCommentAdded={this.handleCommentAdded} />
        </ContentInside>
      </CommentBlock>
    );
  }

  private renderFooter(): JSX.Element {
    const {stopType, planProdId, maintenanceId} = this.state;
    const disabled =
      stopType === undefined ||
      (stopType === StopType.ChangePlanProd && planProdId === undefined) ||
      (stopType === StopType.Maintenance && maintenanceId === undefined);
    return (
      <Footer>
        <Button onClick={this.handleSave} disabled={disabled}>
          ENREGISTRER
        </Button>
      </Footer>
    );
  }

  public render(): JSX.Element {
    // const {stop} = this.props;
    // const {stopType, unplannedStops, cleanings, comments} = this.state;

    return (
      <Wrapper>
        {this.renderHeader()}
        {this.renderSummary()}
        <Content>
          {this.renderComments()}
          <SideBySide>
            {this.renderStopType()}
            {this.renderCleanings()}
          </SideBySide>
          {this.renderUnplannedStops()}
        </Content>
        {this.renderFooter()}
      </Wrapper>
    );
  }
}

const Wrapper = styled.div`
  user-select: none;
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  flex-shrink: 0;
  display: flex;
  padding: 16px;
  box-sizing: border-box;
  height: 75px;
  background-color: ${Colors.PrimaryDark};
  color: ${Colors.TextOnPrimary};
  z-index: 10;
`;

const HeaderLeft = styled.div`
  flex-shrink: 0;
  width: 128px;
  display: flex;
  flex-direction: column;
`;

const HeaderLeftStart = styled.div`
  flex-grow: 1;
  flex-basis: 1px;
`;

const HeaderLeftEnd = styled.div`
  flex-grow: 1;
  flex-basis: 1px;
`;

const HeaderLeftLabel = styled.div`
    display: inline-block;
    width: 48px;
    font-size: 13px
    color: ${Palette.Concrete}
`;

const HeaderLeftTimeValue = styled.div`
  display: inline-block;
  font-size: 16px;
`;

const HeaderCenter = styled.div`
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
`;

const HeaderRight = styled.div`
  flex-shrink: 0;
  width: 128px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  font-size: 22px;
`;

const Content = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  background-color: ${Palette.White};
  padding: 16px;
`;

const ContentBlock = styled.div`
  background-color: ${Colors.PrimaryLight};
  color: ${Colors.TextOnPrimary};
`;

const CommentBlock = styled(ContentBlock)`
  margin-bottom: 16px;
`;
const StopTypeBlock = styled(ContentBlock)`
  flex-grow: 1;
  flex-basis: 1px;
`;
const CleaningBlock = styled(ContentBlock)`
  flex-grow: 1;
  flex-basis: 1px;
  margin-left: 16px;
`;
const UnplannedStopsBlock = styled(ContentBlock)`
  margin-top: 16px;
`;

const SideBySide = styled.div`
  display: flex;
`;

const SummaryWrapper = styled.div`
  padding: 16px;
  box-shadow: 0px 10px 10px -12px rgba(0, 0, 0, 0.75);
  z-index: 10;
`;

const ContentTitle = styled.div`
  background-color: ${Colors.SecondaryDark};
  color: ${Colors.TextOnSecondary};
  padding: 8px 16px;
  font-size: 22px;
`;

const ContentInside = styled.div`
  padding: 16px;
`;

const Footer = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 64px;
  background-color: ${Colors.PrimaryDark};
  box-shadow: 0px 0px 8px 0px rgba(0, 0, 0, 0.6);
  z-index: 10;
`;
