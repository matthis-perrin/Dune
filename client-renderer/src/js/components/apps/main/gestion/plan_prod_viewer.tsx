import * as React from 'react';
import styled from 'styled-components';

import {BobinesForm} from '@root/components/apps/plan_prod_editor/bobines_form';
import {OrderableEncrier} from '@root/components/apps/plan_prod_editor/orderable_encrier';
import {ProductionTable} from '@root/components/apps/plan_prod_editor/production_table';
import {TopBar} from '@root/components/apps/plan_prod_editor/top_bar';
import {Bobine, CURVE_EXTRA_SPACE} from '@root/components/common/bobine';
import {Perfo as PerfoComponent} from '@root/components/common/perfo';
import {Refente as RefenteComponent} from '@root/components/common/refente';
import {AutoFontWeight} from '@root/components/core/auto_font_weight';
import {LoadingScreen} from '@root/components/core/loading_screen';
import {SizeMonitor, SCROLLBAR_WIDTH} from '@root/components/core/size_monitor';
import {WithColor} from '@root/components/core/with_colors';
import {getStockReel, getStockTerme} from '@root/lib/bobine';
import {CAPACITE_MACHINE} from '@root/lib/constants';
import {computePlanProdRef} from '@root/lib/plan_prod';
import {bobinesQuantitiesStore} from '@root/stores/data_store';
import {stocksStore, cadencierStore} from '@root/stores/list_store';
import {theme} from '@root/theme';

import {Stock, BobineQuantities, PlanProductionData} from '@shared/models';

interface PlanProdViewerProps {
  planProd: PlanProductionData;
  width: number;
}

interface PlanProdViewerState {
  stocks?: Map<string, Stock[]>;
  cadencier?: Map<string, Map<number, number>>;
  bobineQuantities?: BobineQuantities[];
}

export class PlanProdViewer extends React.Component<PlanProdViewerProps, PlanProdViewerState> {
  public static displayName = 'PlanProdViewer';

  public constructor(props: PlanProdViewerProps) {
    super(props);
    this.state = {};
  }

  public componentDidMount(): void {
    stocksStore.addListener(this.handleStoresChanged);
    cadencierStore.addListener(this.handleStoresChanged);
    bobinesQuantitiesStore.addListener(this.handleStoresChanged);
  }

  public componentWillUnmount(): void {
    stocksStore.removeListener(this.handleStoresChanged);
    cadencierStore.removeListener(this.handleStoresChanged);
    bobinesQuantitiesStore.removeListener(this.handleStoresChanged);
  }

  private readonly handleStoresChanged = (): void => {
    this.setState({
      stocks: stocksStore.getStockIndex(),
      cadencier: cadencierStore.getCadencierIndex(),
      bobineQuantities: bobinesQuantitiesStore.getData(),
    });
  };

  public render(): JSX.Element {
    const {bobineQuantities, cadencier, stocks} = this.state;
    if (!bobineQuantities || !cadencier || !stocks) {
      return <LoadingScreen />;
    }

    const {width, planProd} = this.props;
    const {
      bobines,
      refente,
      encriers,
      papier,
      perfo,
      polypro,
      tourCount,
      bobinesMini,
      day,
      indexInDay,
      speed,
    } = planProd;

    const leftPadding =
      (CURVE_EXTRA_SPACE * (width - 2 * theme.page.padding)) / (1 - 2 * CURVE_EXTRA_SPACE);
    const availableWidth = width - 2 * theme.page.padding - leftPadding;
    const pixelPerMM = availableWidth / CAPACITE_MACHINE;

    const bobinesBlock = (
      <BobinesForm
        selectedBobines={bobines}
        selectableBobines={[]}
        selectedRefente={refente}
        pixelPerMM={pixelPerMM}
        onReorder={() => {}}
      />
    );

    const refenteBlock = <RefenteComponent refente={refente} pixelPerMM={pixelPerMM} />;

    const encriersBlock = (
      <OrderableEncrier
        pixelPerMM={pixelPerMM}
        selectedBobines={bobines}
        selectedRefente={refente}
        allValidEncrierColors={[encriers]}
        encrierColors={encriers}
        onReorder={() => {}}
      />
    );

    const papierStockReel = getStockReel(papier.ref, stocks);
    const papierStockTerme = getStockTerme(papier.ref, stocks);
    const papierBlock = (
      <WithColor color={papier.couleurPapier}>
        {color => (
          <Bobine
            size={papier.laize || 0}
            pixelPerMM={pixelPerMM}
            decalage={refente.decalage}
            color={color.backgroundHex}
            strokeWidth={theme.planProd.selectedStrokeWidth}
          >
            <AutoFontWeight
              style={{color: color.textHex, textAlign: 'center'}}
              fontSize={theme.planProd.elementsBaseLargeFontSize * pixelPerMM}
            >
              {`Bobine Papier ${papier.couleurPapier} ${papier.ref} - Largeur ${papier.laize} - ${
                papier.grammage
              }g - ${papierStockReel} (à terme ${papierStockTerme})`}
            </AutoFontWeight>
          </Bobine>
        )}
      </WithColor>
    );

    const perfoBlock = <PerfoComponent perfo={perfo} pixelPerMM={pixelPerMM} />;

    const polyproStockReel = getStockReel(polypro.ref, stocks);
    const polyproStockTerme = getStockTerme(polypro.ref, stocks);
    const polyproBlock = (
      <WithColor color={polypro.couleurPapier}>
        {color => (
          <Bobine
            size={polypro.laize || 0}
            pixelPerMM={pixelPerMM}
            decalage={refente.decalage}
            color={color.backgroundHex}
            strokeWidth={theme.planProd.selectedStrokeWidth}
          >
            <AutoFontWeight
              style={{color: color.textHex, textAlign: 'center'}}
              fontSize={theme.planProd.elementsBaseLargeFontSize * pixelPerMM}
            >
              {`Bobine Polypro ${polypro.ref} - Largeur ${polypro.laize} - ${
                polypro.grammage
              }μg - ${polyproStockReel} (à terme ${polyproStockTerme})`}
            </AutoFontWeight>
          </Bobine>
        )}
      </WithColor>
    );

    const padding = <div style={{height: theme.planProd.basePadding * pixelPerMM}} />;
    const halfPadding = <div style={{height: (theme.planProd.basePadding * pixelPerMM) / 2}} />;

    const productionTable =
      bobines.length > 0 ? (
        <React.Fragment>
          {padding}
          <ProductionTable
            width={availableWidth + leftPadding}
            planProduction={{selectedBobines: bobines, tourCount}}
            stocks={stocks}
            cadencier={cadencier}
            bobineQuantities={bobineQuantities}
            canRemove={false}
            minimums={new Map<string, number>(bobinesMini)}
            onMiniUpdated={() => {}}
          />
        </React.Fragment>
      ) : (
        <React.Fragment />
      );

    const planProductionRef = computePlanProdRef(day, indexInDay);

    return (
      <PlanProdEditorContainer style={{width}}>
        <TopBar
          bobines={bobines}
          isComplete
          isPrinting
          onSpeedChange={() => {}}
          onTourCountChange={() => {}}
          planProdRef={planProductionRef}
          speed={speed}
          tourCount={tourCount}
        />
        <Wrapper style={{width: availableWidth + leftPadding}}>
          {productionTable}
          {padding}
          <div style={{alignSelf: 'flex-end'}}>{bobinesBlock}</div>
          {padding}
          <div style={{alignSelf: 'flex-end'}}>{refenteBlock}</div>
          {halfPadding}
          <div style={{alignSelf: 'flex-end'}}>{encriersBlock}</div>
          {halfPadding}
          <div style={{alignSelf: 'flex-end'}}>{papierBlock}</div>
          {padding}
          <div style={{alignSelf: 'flex-start', paddingLeft: leftPadding}}>{perfoBlock}</div>
          {padding}
          <div style={{alignSelf: 'flex-end'}}>{polyproBlock}</div>
          {padding}
        </Wrapper>
      </PlanProdEditorContainer>
    );
  }
}

const PlanProdEditorContainer = styled.div`
  margin: auto;
  background-color: ${theme.planProd.contentBackgroundColor};
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 ${theme.page.padding}px;
  margin: auto;
`;
