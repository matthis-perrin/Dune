import {find} from 'lodash-es';
import React from 'react';
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
import {ViewerTopBar} from '@root/components/common/viewers/top_bar';
import {Card1} from '@root/components/core/card';
import {LoadingIndicator} from '@root/components/core/loading_indicator';
import {Select, Option} from '@root/components/core/select';
import {getBobineTotalSell, getBobineSellingPastYear, getQuantityToProduce} from '@root/lib/bobine';
import {getStockTerme, getStockReel, getStockReserve} from '@root/lib/stocks';
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
import {BobineFille, Cliche, Stock, BobineQuantities, PlanProduction} from '@shared/models';

enum CadencierMode {
  Day = 'day',
  Month = 'month',
  Year = 'year',
}

interface Props {
  bobineRef: string;
}

interface State {
  bobine?: BobineFille;
  stocks?: Map<string, Stock[]>;
  cadencier?: Map<string, Map<number, number>>;
  cadencierMode: CadencierMode;
  bobineQuantities?: BobineQuantities[];
  plansProd?: PlanProduction[];
  cliche1?: Cliche;
  cliche2?: Cliche;
  clicheLoaded: boolean;
}

export class ViewBobineApp extends React.Component<Props, State> {
  public static displayName = 'ViewBobineApp';
  private readonly cadencier = React.createRef<BobineCadencierChart>();

  public constructor(props: Props) {
    super(props);
    this.state = {clicheLoaded: false, cadencierMode: CadencierMode.Month};
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
    const designationOperateur =
      bobine.designationOperateur === undefined ? '' : bobine.designationOperateur;
    return (
      <React.Fragment>
        <CardHeader>
          <CardTitle>{'Info'}</CardTitle>
        </CardHeader>
        <BasicInfo
          data={[
            {title: 'Désignation', value: bobine.designation},
            {title: 'Désignation Opérateur', value: designationOperateur},
            {title: 'Laize', value: bobine.laize},
            {title: 'Couleur Papier', value: bobine.couleurPapier},
            {title: 'Grammage', value: `${bobine.grammage}g`},
            {title: 'Longueur', value: `${bobine.longueurDesignation}m`},
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

    const MONTHS_IN_YEAR = 12;
    const yearSell = getBobineSellingPastYear(cadencier.get(bobineRef));
    const {threshold, quantity, minSell, maxSell} = getQuantityToProduce(
      yearSell,
      bobineQuantities
    );
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
        </CardHeader>
        <BasicInfo
          style={{marginBottom: 8}}
          data={[
            {
              title: <div style={{width: titleWidth}}>Stocks réel</div>,
              value: numberWithSeparator(stockReel),
            },
            {
              title: withPopup(
                <div style={{width: titleWidth}}>Seuil d'alerte</div>,
                <div>{`Seuil d'alerte définit pour une vente annuelle comprise entre ${minSell} et ${maxSell}`}</div>
              ),
              value: numberWithSeparator(threshold),
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

  private renderCadencier(): JSX.Element {
    const {cadencierMode, bobine} = this.state;
    if (cadencierMode === CadencierMode.Day) {
      return <BobineCadencierChartByDay chartRef={this.cadencier} bobine={bobine} />;
    } else if (cadencierMode === CadencierMode.Month) {
      return <BobineCadencierChartByMonth chartRef={this.cadencier} bobine={bobine} />;
    } else if (cadencierMode === CadencierMode.Year) {
      return <BobineCadencierChartByYear chartRef={this.cadencier} bobine={bobine} />;
    }
    return <React.Fragment />;
  }

  private renderCadencierSelect(): JSX.Element {
    const {cadencierMode} = this.state;
    return (
      <Select
        style={{width: 180}}
        onChange={event => this.setState({cadencierMode: event.target.value as CadencierMode})}
        value={cadencierMode}
      >
        <Option value={CadencierMode.Day}>Par jours</Option>
        <Option value={CadencierMode.Month}>Par mois</Option>
        <Option value={CadencierMode.Year}>Par année</Option>
      </Select>
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
    const barcode = bobine ? <C39>{`*${bobine.ref}*`}</C39> : <React.Fragment />;

    return (
      <AppWrapper>
        <ViewerTopBar sommeil={bobine && bobine.sommeil} color={bobine && bobine.couleurPapier}>
          <React.Fragment>
            <span style={{marginRight: 16}}>{`Bobine ${bobineRef}`}</span>
            {barcode}
          </React.Fragment>
        </ViewerTopBar>
        <InfoContainer>
          <GeneralInfoContainer>{this.renderGeneralInfo()}</GeneralInfoContainer>
          <EtatInfoContainer>{this.renderStockInfo()}</EtatInfoContainer>
          <ClichesInfoContainer>{this.renderClichesInfo()}</ClichesInfoContainer>
        </InfoContainer>
        <CandencierContainer>
          <CardHeader>
            <CardTitle>Historique des ventes</CardTitle>
            {this.renderCadencierSelect()}
          </CardHeader>
          <CadencierChartContainer>{this.renderCadencier()}</CadencierChartContainer>
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

const C39 = styled.div`
  font-family: C39;
  background-color: white;
  font-size: 64px;
  padding: 4px 8px;
`;
