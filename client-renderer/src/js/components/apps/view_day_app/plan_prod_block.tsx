import * as React from 'react';
import styled from 'styled-components';

import {Duration} from '@root/components/common/duration';
import {WithColor} from '@root/components/core/with_colors';
import {
  PLAN_PROD_NUMBER_DIGIT_COUNT,
  getMetrageLineaire,
  getBobineMereConsumption,
} from '@root/lib/plan_prod';
import {PlanProdBase} from '@root/lib/plan_prod_order';
import {padNumber, numberWithSeparator, roundedToDigit, formatProdTime} from '@root/lib/utils';
import {FontWeight} from '@root/theme';

interface PlanProdBlockProps {
  planProd: PlanProdBase;
}

export class PlanProdBlock extends React.Component<PlanProdBlockProps> {
  public static displayName = 'PlanProdBlock';

  public render(): JSX.Element {
    const {planProd} = this.props;
    const {plan} = planProd;

    return (
      <WithColor color={plan.data.papier.couleurPapier}>
        {color => (
          <Wrapper style={{color: color.textHex}}>
            <Top>
              <PlanId>{padNumber(plan.id, PLAN_PROD_NUMBER_DIGIT_COUNT)}</PlanId>
              <TopInfoWrapper>
                <TopInfoValue>{numberWithSeparator(getMetrageLineaire(plan.data))}</TopInfoValue>
                <TopInfoLabel>MÈTRES LINÉAIRES</TopInfoLabel>
              </TopInfoWrapper>
              <TopInfoWrapper>
                <TopInfoValue>{numberWithSeparator(plan.data.tourCount)}</TopInfoValue>
                <TopInfoLabel>TOURS</TopInfoLabel>
              </TopInfoWrapper>
              <TopInfoWrapper>
                <TopInfoValue>
                  {roundedToDigit(getBobineMereConsumption(plan.data), 1)}
                </TopInfoValue>
                <TopInfoLabel>BOBINES MÈRES</TopInfoLabel>
              </TopInfoWrapper>
              <TopInfoWrapper>
                <TopInfoValue>{numberWithSeparator(plan.data.speed)}</TopInfoValue>
                <TopInfoLabel>M/MIN</TopInfoLabel>
              </TopInfoWrapper>
              <TopTimeGroupWrapper>
                <TopTimeWrapper>
                  <TopTimeLabel style={{width: 64}}>Début :</TopTimeLabel>
                  <TopTimeValue>{formatProdTime(planProd.start)}</TopTimeValue>
                </TopTimeWrapper>
                <TopTimeWrapper>
                  <TopTimeLabel style={{width: 64}}>Fin :</TopTimeLabel>
                  <TopTimeValue>{formatProdTime(planProd.end)}</TopTimeValue>
                </TopTimeWrapper>
              </TopTimeGroupWrapper>
              <TopTimeGroupWrapper>
                <TopTimeWrapper>
                  <TopTimeLabel style={{width: 96}}>Réglage :</TopTimeLabel>
                  <TopTimeValue>
                    <Duration durationMs={planProd.operationsTotal} />
                  </TopTimeValue>
                </TopTimeWrapper>
                <TopTimeWrapper>
                  <TopTimeLabel style={{width: 96}}>Production :</TopTimeLabel>
                  <TopTimeValue>
                    <Duration durationMs={planProd.prodLength} />
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
