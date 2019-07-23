import * as React from 'react';
import styled from 'styled-components';

import {CleaningsForm} from '@root/components/apps/production/cleanings_form';
import {StopCommentForm} from '@root/components/apps/stop/stop_comment_form';
import {StopDetails} from '@root/components/apps/stop/stop_details';
import {UnplannedStopsForm} from '@root/components/apps/stop/stop_other_reasons_form';
import {StopTypeForm} from '@root/components/apps/stop/stop_type_form';
import {Timer} from '@root/components/common/timer';
import {Button} from '@root/components/core/button';
import {Palette, Colors} from '@root/theme';

import {Stop, StopType, UnplannedStop, Cleaning} from '@shared/models';

interface StopFormProps {
  stop: Stop;
}

interface StopFormState {
  stopType?: StopType;
  unplannedStops: UnplannedStop[];
  cleanings: Cleaning[];
  comments: string[];
  planProdId?: string;
  maintenanceId?: string;
}

export class StopForm extends React.Component<StopFormProps, StopFormState> {
  public static displayName = 'StopForm';

  public constructor(props: StopFormProps) {
    super(props);
    this.state = {unplannedStops: [], cleanings: [], comments: []};
  }

  private readonly handleSave = (): void => {
    console.log('Save');
  };

  private readonly handleStopTypeChange = (
    newType: StopType,
    newPlanProdId?: string,
    newMaintenanceId?: string
  ): void => {
    this.setState({stopType: newType});
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

  private formatTime(time?: number): string {
    return time === undefined ? 'en cours' : new Date(time).toLocaleTimeString('fr');
  }

  private renderHeader(): JSX.Element {
    const {stop} = this.props;
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
          <Timer start={stop.start} end={stop.end} />
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
    return (
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
            maintenanceId={maintenanceId}
            onRemoveType={this.handleRemoveType}
            onRemoveUnplannedStop={this.handleRemoveUnplannedStop}
            onRemoveComment={this.handleRemoveComment}
            onRemoveCleaning={this.handleRemoveCleaning}
          />
        </ContentInside>
      </ContentBlock>
    );
  }

  private renderStopType(): JSX.Element {
    const {stop} = this.props;
    const {stopType, planProdId, maintenanceId} = this.state;
    return (
      <ContentBlock>
        <ContentTitle>TYPE D'ARRÊT</ContentTitle>
        <ContentInside>
          <StopTypeForm
            stop={stop}
            type={stopType}
            planProdId={planProdId}
            maintenanceId={maintenanceId}
            onChange={this.handleStopTypeChange}
          />
        </ContentInside>
      </ContentBlock>
    );
  }

  private renderOtherReasons(): JSX.Element {
    const {stop} = this.props;
    const {unplannedStops, stopType} = this.state;
    if (stopType === undefined || stopType !== StopType.Unplanned) {
      return <React.Fragment />;
    }
    return (
      <ContentBlock>
        <ContentTitle>AUTRES RAISONS</ContentTitle>
        <ContentInside>
          <UnplannedStopsForm
            stop={stop}
            unplannedStops={unplannedStops}
            onChange={this.handleOtherReasonsChanged}
          />
        </ContentInside>
      </ContentBlock>
    );
  }

  private renderCleanings(): JSX.Element {
    const {stop} = this.props;
    const {cleanings, stopType} = this.state;
    if (stopType === undefined) {
      return <React.Fragment />;
    }
    return (
      <ContentBlock>
        <ContentTitle>NETTOYAGES</ContentTitle>
        <ContentInside>
          <CleaningsForm stop={stop} cleanings={cleanings} onChange={this.handleCleaningsChanged} />
        </ContentInside>
      </ContentBlock>
    );
  }

  private renderComments(): JSX.Element {
    const {stop} = this.props;
    const {stopType} = this.state;
    if (stopType === undefined) {
      return <React.Fragment />;
    }
    return (
      <ContentBlock>
        <ContentInside>
          <StopCommentForm stop={stop} onCommentAdded={this.handleCommentAdded} />
        </ContentInside>
      </ContentBlock>
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
        <Content>
          {this.renderSummary()}
          {this.renderComments()}
          {this.renderStopType()}
          {this.renderOtherReasons()}
          {this.renderCleanings()}
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
  box-shadow: 0px 0px 8px 0px rgba(0, 0, 0, 0.6);
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
`;

const ContentBlock = styled.div`
  background-color: ${Colors.PrimaryLight};
  color: ${Colors.TextOnPrimary};
  margin: 16px 16px 0 16px;
  &:last-of-type {
    margin-bottom: 16px;
  }
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
