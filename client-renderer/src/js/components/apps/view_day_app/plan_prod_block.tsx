import * as React from 'react';
import styled from 'styled-components';

import {Duration} from '@root/components/common/duration';
import {WithColor} from '@root/components/core/with_colors';
import {
  PLAN_PROD_NUMBER_DIGIT_COUNT,
  getMetrageLineaire,
  getBobineMereConsumption,
} from '@root/lib/plan_prod';
import {padNumber, numberWithSeparator, roundedToDigit, formatProdTime} from '@root/lib/utils';
import {FontWeight} from '@root/theme';

import {PlanProdSchedule} from '@shared/models';

interface PlanProdBlockProps {
  schedule: PlanProdSchedule;
}

export class PlanProdBlock extends React.Component<PlanProdBlockProps> {
  public static displayName = 'PlanProdBlock';

  public render(): JSX.Element {
    const {schedule} = this.props;
    const {planProd} = schedule;

    return (
      <WithColor color={planProd.data.papier.couleurPapier}>
        {color => (
          <Wrapper style={{color: color.textHex}}>
            <Top>
              <PlanId>{padNumber(planProd.id, PLAN_PROD_NUMBER_DIGIT_COUNT)}</PlanId>
              <TopInfoWrapper>
                <TopInfoValue>
                  {numberWithSeparator(getMetrageLineaire(planProd.data))}
                </TopInfoValue>
                <TopInfoLabel>MÈTRES LINÉAIRES</TopInfoLabel>
              </TopInfoWrapper>
              <TopInfoWrapper>
                <TopInfoValue>{numberWithSeparator(planProd.data.tourCount)}</TopInfoValue>
                <TopInfoLabel>TOURS</TopInfoLabel>
              </TopInfoWrapper>
              <TopInfoWrapper>
                <TopInfoValue>
                  {roundedToDigit(getBobineMereConsumption(planProd.data), 1)}
                </TopInfoValue>
                <TopInfoLabel>BOBINES MÈRES</TopInfoLabel>
              </TopInfoWrapper>
              <TopInfoWrapper>
                <TopInfoValue>{numberWithSeparator(planProd.data.speed)}</TopInfoValue>
                <TopInfoLabel>M/MIN</TopInfoLabel>
              </TopInfoWrapper>
              <TopTimeGroupWrapper>
                <TopTimeWrapper>
                  <TopTimeLabel style={{width: 64}}>Début :</TopTimeLabel>
                  <TopTimeValue>{formatProdTime(new Date(schedule.start))}</TopTimeValue>
                </TopTimeWrapper>
                <TopTimeWrapper>
                  <TopTimeLabel style={{width: 64}}>Fin :</TopTimeLabel>
                  <TopTimeValue>{formatProdTime(new Date(schedule.end))}</TopTimeValue>
                </TopTimeWrapper>
              </TopTimeGroupWrapper>
              <TopTimeGroupWrapper>
                <TopTimeWrapper>
                  <TopTimeLabel style={{width: 96}}>Réglage :</TopTimeLabel>
                  <TopTimeValue>
                    <Duration
                      durationMs={schedule.doneOperationsMs + schedule.plannedOperationsMs}
                    />
                  </TopTimeValue>
                </TopTimeWrapper>
                <TopTimeWrapper>
                  <TopTimeLabel style={{width: 96}}>Production :</TopTimeLabel>
                  <TopTimeValue>
                    <Duration durationMs={schedule.doneProdMs + schedule.plannedProdMs} />
                  </TopTimeValue>
                </TopTimeWrapper>
              </TopTimeGroupWrapper>
            </Top>
          </Wrapper>
        )}
      </WithColor>
    );
  }
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const Top = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
`;

const PlanId = styled.div`
  font-size: 22px;
`;

const TopInfoWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const TopInfoValue = styled.div`
  font-size: 18px;
`;

const TopInfoLabel = styled.div`
  font-size: 10px;
  font-weight: ${FontWeight.SemiBold};
`;

const TopTimeGroupWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const TopTimeWrapper = styled.div`
  display: flex;
  font-size: 16px;
`;

const TopTimeValue = styled.div`
  text-align: left;
`;

const TopTimeLabel = styled.div`
  text-align: right;
  margin-right: 8px;
`;
