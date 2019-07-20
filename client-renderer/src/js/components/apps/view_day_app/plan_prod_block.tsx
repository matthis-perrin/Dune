import * as React from 'react';
import styled from 'styled-components';

import {WithColor} from '@root/components/core/with_colors';
import {PLAN_PROD_NUMBER_DIGIT_COUNT} from '@root/lib/plan_prod';
import {PlanProdBase} from '@root/lib/plan_prod_order';
import {padNumber} from '@root/lib/utils';

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
                <TopInfoValue>{plan.data.tourCount}</TopInfoValue>
                <TopInfoLabel>TOURS</TopInfoLabel>
              </TopInfoWrapper>
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
  font-size: 14px;
`;
