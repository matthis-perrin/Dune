import * as React from 'react';
import styled from 'styled-components';

import {StopDetails} from '@root/components/apps/production/stop_details';
import {StopOtherReasonsForm} from '@root/components/apps/production/stop_other_reasons_form';
import {StopTypeForm} from '@root/components/apps/production/stop_type_form';
import {Timer} from '@root/components/common/timer';
import {Button} from '@root/components/core/button';
import {Palette, Colors, theme} from '@root/theme';

import {Stop, StopType, UnplannedStop} from '@shared/models';

interface StopModalProps {
  stop: Stop;
}

interface StopModalState {
  stopType?: StopType;
  otherReasons: UnplannedStop[];
}

export class StopModal extends React.Component<StopModalProps, StopModalState> {
  public static displayName = 'StopModal';

  public constructor(props: StopModalProps) {
    super(props);
    this.state = {otherReasons: []};
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
    this.setState({otherReasons: newOtherReasons});
  };

  private formatTime(time?: number): string {
    return time === undefined ? 'en cours' : new Date(time).toLocaleTimeString('fr');
  }

  public render(): JSX.Element {
    const {stop} = this.props;
    const {stopType, otherReasons} = this.state;

    return (
      <Scroller>
        <Wrapper>
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
          <Content>
            <ContentBlock>
              <ContentTitle>RÉSUMÉ DE L'ARRÊT</ContentTitle>
              <ContentInside>
                <StopDetails stop={stop} />
              </ContentInside>
            </ContentBlock>
            <ContentBlock>
              <ContentTitle>TYPE D'ARRÊT</ContentTitle>
              <ContentInside>
                <StopTypeForm stop={stop} type={stopType} onChange={this.handleStopTypeChange} />
              </ContentInside>
            </ContentBlock>
            <ContentBlock>
              <ContentTitle>AUTRES RAISONS</ContentTitle>
              <ContentInside>
                <StopOtherReasonsForm
                  stop={stop}
                  otherReasons={otherReasons}
                  onChange={this.handleOtherReasonsChanged}
                />
              </ContentInside>
            </ContentBlock>
            <ContentBlock>
              <ContentTitle>COMMENTAIRES</ContentTitle>
              <ContentInside>
                <CommentTextarea placeholder="Commentaires" />
              </ContentInside>
            </ContentBlock>
          </Content>
          <Footer>
            <Button onClick={this.handleSave}>ENREGISTRER</Button>
          </Footer>
        </Wrapper>
      </Scroller>
    );
  }
}

const borderRadius = 8;

const Scroller = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  overflow-y: auto;
`;

const Wrapper = styled.div`
  width: 900px;
  margin: 32px auto;
  display: flex;
  flex-direction: column;
  box-shadow: 0px 0px 32px 0px ${Palette.Black};
  border-radius: ${borderRadius}px;
`;

const Header = styled.div`
  flex-shrink: 0;
  display: flex;
  padding: 16px;
  box-sizing: border-box;
  height: 75px;
  background-color: ${Colors.PrimaryDark};
  color: ${Colors.TextOnPrimary};
  border-top-left-radius: ${borderRadius}px;
  border-top-right-radius: ${borderRadius}px;
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

const CommentTextarea = styled.textarea`
  font-family: ${theme.base.fontFamily};
  font-size: 16px;
  border: none;
  box-sizing: border-box;
  outline: none;
  padding: ${theme.input.padding};
  width: 100%;
  max-width: 100%;
  min-width: 100%;
  height: 128px;
`;

const Footer = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 64px;
  background-color: ${Colors.PrimaryDark};
  border-bottom-left-radius: ${borderRadius}px;
  border-bottom-right-radius: ${borderRadius}px;
`;
