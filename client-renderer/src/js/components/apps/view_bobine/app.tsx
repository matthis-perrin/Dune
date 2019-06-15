import {find} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {BobineCadencierChart} from '@root/components/charts/cadencier';
import {BasicInfo} from '@root/components/common/basic_info';
import {ViewerTopBar} from '@root/components/common/viewers/top_bar';
import {Card1} from '@root/components/core/card';
import {LoadingIndicator} from '@root/components/core/loading_indicator';
import {bobinesFillesStore, clichesStore} from '@root/stores/list_store';
import {theme} from '@root/theme/default';

import {getPoses, getCouleurs} from '@shared/lib/cliches';
import {BobineFille, Cliche} from '@shared/models';

interface Props {
  bobineRef: string;
}

interface State {
  bobine?: BobineFille;
  cliche1?: Cliche;
  cliche2?: Cliche;
  clicheLoaded: boolean;
}

export class ViewBobineApp extends React.Component<Props, State> {
  public static displayName = 'ViewBobineApp';

  public constructor(props: Props) {
    super(props);
    this.state = {clicheLoaded: false};
    document.title = `Bobine ${props.bobineRef}`;
  }

  public componentDidMount(): void {
    bobinesFillesStore.addListener(this.refreshBobineInfo);
    clichesStore.addListener(this.refreshBobineInfo);
  }

  public componentWillUnmount(): void {
    bobinesFillesStore.removeListener(this.refreshBobineInfo);
    clichesStore.removeListener(this.refreshBobineInfo);
  }

  private readonly refreshBobineInfo = (): void => {
    const {bobineRef} = this.props;
    const bobines = bobinesFillesStore.getData();
    if (!bobines) {
      return;
    }
    const bobine = find<BobineFille>(bobines, b => b.ref === bobineRef);
    if (!bobine) {
      return;
    }
    let cliche1: Cliche | undefined;
    let cliche2: Cliche | undefined;
    const allCliches = clichesStore.getData();
    const clicheLoaded = allCliches !== undefined;
    for (const cliche of allCliches || []) {
      if (cliche.ref === bobine.refCliche1) {
        cliche1 = cliche;
      } else if (cliche.ref === bobine.refCliche2) {
        cliche2 = cliche;
      }
    }
    this.setState({bobine, cliche1, cliche2, clicheLoaded});
  };

  private renderGeneralInfo(): JSX.Element {
    const {bobine} = this.state;
    if (!bobine) {
      return <LoadingIndicator size="medium" />;
    }
    return (
      <React.Fragment>
        <CardTitle>{'Info'}</CardTitle>
        <BasicInfo
          data={[
            {title: 'Désignation', value: bobine.designation},
            {title: 'Laize', value: bobine.laize},
            {title: 'Couleur Papier', value: bobine.couleurPapier},
            {title: 'Grammage', value: bobine.grammage},
            {title: 'Longueur', value: bobine.longueur},
            {title: "Type d'impression", value: bobine.typeImpression},
          ]}
        />
      </React.Fragment>
    );
  }

  private renderClichesInfo(): JSX.Element {
    const {cliche1, cliche2, clicheLoaded} = this.state;
    if (!clicheLoaded) {
      return <LoadingIndicator size="medium" />;
    }
    if (cliche1 === undefined && cliche2 === undefined) {
      return <NoClicheContainer>Aucun cliché associé</NoClicheContainer>;
    }
    const elements: JSX.Element[] = [];

    if (cliche1) {
      elements.push(this.renderCliche(cliche1, 1));
    }
    if (cliche1 && cliche2) {
      elements.push(<ClichePadding key="cliche-padding" />);
    }
    if (cliche2) {
      elements.push(this.renderCliche(cliche2, 2));
    }

    return <span>{elements}</span>;
  }

  private renderCliche(cliche: Cliche, index: number): JSX.Element {
    return (
      <ClicheWrapper key={cliche.ref}>
        <CardTitle>{`Cliché ${index}`}</CardTitle>
        <BasicInfo
          data={[
            {title: 'Ref', value: cliche.ref},
            {title: 'Désignation', value: cliche.designation},
            {title: 'Poses', value: getPoses(cliche).join(', ')},
            {title: 'Couleurs', value: getCouleurs(cliche).join(', ')},
            {title: 'Ordre important', value: cliche.importanceOrdreCouleurs},
          ]}
        />
      </ClicheWrapper>
    );
  }

  public render(): JSX.Element {
    const {bobineRef} = this.props;
    const {bobine} = this.state;

    return (
      <AppWrapper>
        <ViewerTopBar
          sommeil={bobine && bobine.sommeil}
          color={bobine && bobine.couleurPapier}
        >{`Bobine ${bobineRef}`}</ViewerTopBar>
        <InfoContainer>
          <GeneralInfoContainer>{this.renderGeneralInfo()}</GeneralInfoContainer>
          <ClichesInfoContainer>{this.renderClichesInfo()}</ClichesInfoContainer>
        </InfoContainer>
        <CandencierContainer>
          <CardTitle>Historique des ventes</CardTitle>
          <CadencierChartContainer>
            <BobineCadencierChart bobine={bobine} />
          </CadencierChartContainer>
        </CandencierContainer>
      </AppWrapper>
    );
  }
}

const AppWrapper = styled.div`
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  background-color: ${theme.page.backgroundColor};
`;

const InfoContainer = styled.div`
  display: flex;
  flex-shrink: 0;
`;

const ContainerBase = styled(Card1)`
  padding: 16px;
  font-size: 13px;
`;

const CARD_MARGIN = 16;

const GeneralInfoContainer = styled(ContainerBase)`
  flex-basis: 1px;
  flex-grow: 1;
  margin: ${CARD_MARGIN}px ${CARD_MARGIN / 2}px ${CARD_MARGIN / 2}px ${CARD_MARGIN}px;
`;

const ClichesInfoContainer = styled(ContainerBase)`
  flex-basis: 1px;
  flex-grow: 1;
  margin: ${CARD_MARGIN}px ${CARD_MARGIN}px ${CARD_MARGIN / 2}px ${CARD_MARGIN / 2}px;
`;

const ClicheWrapper = styled.div`
  margin-bottom: 16px;
  &:last-of-type {
    margin-bottom: 0;
  }
`;

const ClichePadding = styled.div`
  height: 16px;
`;

const CardTitle = styled.div`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
`;

const NoClicheContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CandencierContainer = styled(ContainerBase)`
  flex-grow: 1;
  margin: ${CARD_MARGIN / 2}px ${CARD_MARGIN}px ${CARD_MARGIN}px ${CARD_MARGIN}px;
`;

const CadencierChartContainer = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;
