import {find} from 'lodash-es';
import * as React from 'react';
import Popup from 'reactjs-popup';
import styled from 'styled-components';

import {BobineCadencierChart} from '@root/components/charts/cadencier';
import {
  BobineCadencierChartByDay,
  BobineCadencierChartByMonth,
  BobineCadencierChartByYear,
} from '@root/components/charts/cadenciers';
import {BasicInfo} from '@root/components/common/basic_info';
import {BobineColors} from '@root/components/common/bobine_colors';
import {BobineState} from '@root/components/common/bobine_state';
import {ViewerTopBar} from '@root/components/common/viewers/top_bar';
import {Card1} from '@root/components/core/card';
import {LoadingIndicator} from '@root/components/core/loading_indicator';
import {
  getStockTerme,
  getStockReserve,
  getStockReel,
  getBobineState,
  getBobineTotalSell,
} from '@root/lib/bobine';
import {formatMonthCount, numberWithSeparator} from '@root/lib/utils';
import {bobinesQuantitiesStore} from '@root/stores/data_store';
import {
  bobinesFillesStore,
  clichesStore,
  stocksStore,
  cadencierStore,
} from '@root/stores/list_store';
import {theme} from '@root/theme';

import {getCouleursForCliche, getPosesForCliche} from '@shared/lib/cliches';
import {BobineFille, Cliche, Stock, BobineQuantities} from '@shared/models';

interface Props {
  bobineRef: string;
}

interface State {
  bobine?: BobineFille;
  stocks?: Map<string, Stock[]>;
  cadencier?: Map<string, Map<number, number>>;
  bobineQuantities?: BobineQuantities[];
  cliche1?: Cliche;
  cliche2?: Cliche;
  clicheLoaded: boolean;
}

export class ViewBobineApp extends React.Component<Props, State> {
  public static displayName = 'ViewBobineApp';
  private readonly cadencier = React.createRef<BobineCadencierChart>();

  public constructor(props: Props) {
    super(props);
    this.state = {clicheLoaded: false};
    document.title = `Bobine ${props.bobineRef}`;
  }

  public componentDidMount(): void {
    bobinesFillesStore.addListener(this.refreshBobineInfo);
    clichesStore.addListener(this.refreshBobineInfo);
    stocksStore.addListener(this.refreshBobineInfo);
    bobinesQuantitiesStore.addListener(this.refreshBobineInfo);
    cadencierStore.addListener(this.refreshBobineInfo);
  }

  public componentWillUnmount(): void {
    bobinesFillesStore.removeListener(this.refreshBobineInfo);
    clichesStore.removeListener(this.refreshBobineInfo);
    stocksStore.removeListener(this.refreshBobineInfo);
    bobinesQuantitiesStore.removeListener(this.refreshBobineInfo);
    cadencierStore.removeListener(this.refreshBobineInfo);
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
      }
      if (cliche.ref === bobine.refCliche2) {
        cliche2 = cliche;
      }
    }
    const stocks = stocksStore.getStockIndex();
    const cadencier = cadencierStore.getCadencierIndex();
    const bobineQuantities = bobinesQuantitiesStore.getData();
    this.setState({bobine, cliche1, cliche2, clicheLoaded, stocks, cadencier, bobineQuantities});
  };

  private renderGeneralInfo(): JSX.Element {
    const {bobine, stocks} = this.state;
    if (!bobine || !stocks) {
      return <LoadingIndicator size="medium" />;
    }
    return (
      <React.Fragment>
        <CardHeader>
          <CardTitle>{'Info'}</CardTitle>
        </CardHeader>
        <BasicInfo
          data={[
            {title: 'Désignation', value: bobine.designation},
            {title: 'Laize', value: bobine.laize},
            {title: 'Couleur Papier', value: bobine.couleurPapier},
            {title: 'Grammage', value: `${bobine.grammage}g`},
            {title: 'Longueur', value: `${bobine.longueur}m`},
            {title: "Type d'impression", value: bobine.typeImpression || 'Neutre'},
          ]}
        />
      </React.Fragment>
    );
  }

  private renderStockInfo(): JSX.Element {
    const {bobineRef} = this.props;
    const {stocks, bobineQuantities, cadencier} = this.state;
    if (!stocks || !bobineQuantities || !cadencier) {
      return <LoadingIndicator size="medium" />;
    }

    const bobineState = getBobineState(bobineRef, stocks, cadencier, bobineQuantities);
    const {state, quantity, info, yearSell, threshold, minSell, maxSell} = bobineState;
    const MONTHS_IN_YEAR = 12;
    const monthSell = Math.ceil(yearSell / MONTHS_IN_YEAR);
    const stockTerme = getStockTerme(bobineRef, stocks);
    const stockReel = getStockReel(bobineRef, stocks);
    const stockReserve = getStockReserve(bobineRef, stocks);
    const allSell = getBobineTotalSell(bobineRef, cadencier);
    const monthAverage = Math.round((10 * allSell.total) / allSell.monthRange) / 10;
    const monthRange = formatMonthCount(allSell.monthRange);
    const titleWidth = 130;

    const withPopup = (title: JSX.Element, content: JSX.Element): JSX.Element => {
      return (
        <Popup
          trigger={title}
          position="left center"
          on="hover"
          contentStyle={{width: 260, whiteSpace: 'normal'}}
        >
          {content}
        </Popup>
      );
    };

    return (
      <React.Fragment>
        <CardHeader>
          <CardTitle>{'État'}</CardTitle>
          <BobineState info={info} state={state} />
        </CardHeader>
        <BasicInfo
          style={{marginBottom: 8}}
          data={[
            {
              title: <div style={{width: titleWidth}}>Stocks réel</div>,
              value: numberWithSeparator(stockReel),
            },
            {
              title: <div style={{width: titleWidth}}>Commande en cours</div>,
              value: numberWithSeparator(stockReserve),
            },
            {
              title: <div style={{width: titleWidth}}>Stocks à terme</div>,
              value: numberWithSeparator(stockTerme),
            },
          ]}
        />
        <BasicInfo
          style={{marginBottom: 8}}
          data={[
            {
              title: withPopup(
                <div style={{width: titleWidth}}>Ventes annuelle</div>,
                <div>Total des ventes sur les 12 derniers mois.</div>
              ),
              value: numberWithSeparator(yearSell),
            },
            {
              title: withPopup(
                <div style={{width: titleWidth}}>Seuil d'alerte</div>,
                <div>{`Seuil d'alerte définit pour une vente annuelle comprise entre ${minSell} et ${maxSell}`}</div>
              ),
              value: numberWithSeparator(threshold),
            },
            {
              title: withPopup(
                <div style={{width: titleWidth}}>Ventes mensuelle</div>,
                <div>Moyenne mensuelle des ventes sur les 12 derniers mois.</div>
              ),
              value: numberWithSeparator(monthSell),
            },
            {
              title: withPopup(
                <div style={{width: titleWidth}}>Quantité à produire</div>,
                <div>{`Quantité à produire idéale définit pour une vente annuelle comprise entre ${minSell} et ${maxSell}`}</div>
              ),
              value: numberWithSeparator(quantity),
            },
          ]}
        />
        <BasicInfo
          data={[
            {
              title: withPopup(
                <div style={{width: titleWidth}}>Total des ventes</div>,
                <div>Total des ventes depuis la première vente.</div>
              ),
              value: numberWithSeparator(allSell.total),
            },
            {
              title: withPopup(
                <div style={{width: titleWidth}}>Age de la bobine</div>,
                <div>Temps écoulé depuis la première vente.</div>
              ),
              value: monthRange,
            },
            {
              title: withPopup(
                <div style={{width: titleWidth}}>Moyenne mensuelle</div>,
                <div>Moyenne mensuelle des ventes depuis la première vente.</div>
              ),
              value: isNaN(monthAverage) ? '0' : monthAverage,
            },
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
    const colors = getCouleursForCliche(cliche);

    return (
      <ClicheWrapper key={cliche.ref}>
        <CardHeader>
          <CardTitle>{`Cliché ${index}`}</CardTitle>
        </CardHeader>
        <BasicInfo
          data={[
            {title: 'Ref', value: cliche.ref},
            {title: 'Désignation', value: cliche.designation},
            {title: 'Poses', value: getPosesForCliche(cliche).join(', ')},
            {title: 'Couleurs', value: <BobineColors bobineColors={colors} />},
          ]}
        />
      </ClicheWrapper>
    );
  }

  public componentDidUpdate(): void {
    setTimeout(() => {
      if (this.cadencier.current) {
        this.cadencier.current.redrawChart();
      }
    });
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
          <EtatInfoContainer>{this.renderStockInfo()}</EtatInfoContainer>
          <ClichesInfoContainer>{this.renderClichesInfo()}</ClichesInfoContainer>
        </InfoContainer>
        <CandencierContainer>
          <CardHeader>
            <CardTitle>Historique des ventes</CardTitle>
          </CardHeader>
          <CadencierChartContainer>
            {/* <BobineCadencierChartByDay chartRef={this.cadencier} bobine={bobine} /> */}
            <BobineCadencierChartByMonth chartRef={this.cadencier} bobine={bobine} />
            {/* <BobineCadencierChartByYear chartRef={this.cadencier} bobine={bobine} /> */}
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

const EtatInfoContainer = styled(ContainerBase)`
  flex-basis: 1px;
  flex-grow: 1;
  margin: ${CARD_MARGIN}px ${CARD_MARGIN / 2}px ${CARD_MARGIN / 2}px ${CARD_MARGIN / 2}px;
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

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const CardTitle = styled.div`
  flex-shrink: 0;
  font-size: 18px;
  font-weight: 600;
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
  display: flex;
  flex-direction: column;
  padding-bottom: 0;
  margin: ${CARD_MARGIN / 2}px ${CARD_MARGIN}px ${CARD_MARGIN}px ${CARD_MARGIN}px;
`;

const CadencierChartContainer = styled.div`
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`;
