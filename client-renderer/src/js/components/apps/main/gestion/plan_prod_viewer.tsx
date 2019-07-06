import * as React from 'react';
import styled from 'styled-components';

import {BobinesForm} from '@root/components/apps/plan_prod_editor/bobines_form';
import {OrderableEncrier} from '@root/components/apps/plan_prod_editor/orderable_encrier';
import {ProductionTable} from '@root/components/apps/plan_prod_editor/production_table';
import {TopBar} from '@root/components/apps/plan_prod_editor/top_bar';
import {Bobine, CURVE_EXTRA_SPACE} from '@root/components/common/bobine';
import {BobineMereContent} from '@root/components/common/bobine_mere_content';
import {Perfo as PerfoComponent} from '@root/components/common/perfo';
import {Refente as RefenteComponent} from '@root/components/common/refente';
import {AutoFontWeight} from '@root/components/core/auto_font_weight';
import {LoadingScreen} from '@root/components/core/loading_screen';
import {WithColor} from '@root/components/core/with_colors';
import {getStockReel, getStockTerme} from '@root/lib/bobine';
import {CAPACITE_MACHINE} from '@root/lib/constants';
import {padNumber} from '@root/lib/utils';
import {bobinesQuantitiesStore} from '@root/stores/data_store';
import {stocksStore, cadencierStore} from '@root/stores/list_store';
import {theme} from '@root/theme';

import {Stock, BobineQuantities, PlanProduction} from '@shared/models';

interface PlanProdViewerProps {
  planProd: PlanProduction;
  width: number;
}

interface PlanProdViewerState {
  stocks?: Map<string, Stock[]>;
  cadencier?: Map<string, Map<number, number>>;
  bobineQuantities?: BobineQuantities[];
}

const TOP_BAR_MIN_WIDTH = 1100;
const PLAN_PROD_NUMBER_DIGIT_COUNT = 5;

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
      bobinesMax,
      speed,
    } = planProd.data;

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
            <BobineMereContent
              color={color}
              pixelPerMM={pixelPerMM}
              bobine={papier}
              isPolypro={false}
              stocks={stocks}
              tourCount={tourCount}
              selectedBobines={bobines}
            />
          </Bobine>
        )}
      </WithColor>
    );

    const perfoBlock = <PerfoComponent perfo={perfo} pixelPerMM={pixelPerMM} />;

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
            <BobineMereContent
              color={color}
              pixelPerMM={pixelPerMM}
              bobine={papier}
              isPolypro
              stocks={stocks}
              tourCount={tourCount}
              selectedBobines={bobines}
            />
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
            maximums={new Map<string, number>(bobinesMax)}
            onMiniUpdated={() => {}}
            onMaxUpdated={() => {}}
            showQuantity
          />
        </React.Fragment>
      ) : (
        <React.Fragment />
      );

    const planProdTitle = `PRODUCTION N°${padNumber(planProd.id, PLAN_PROD_NUMBER_DIGIT_COUNT)}`;
    const adjustedWidth = Math.max(TOP_BAR_MIN_WIDTH, width);
    const scale = width / adjustedWidth;

    return (
      <PlanProdEditorContainer style={{width}}>
        <TopBar
          style={{
            transformOrigin: 'top left',
            transform: `scale(${scale})`,
          }}
          width={adjustedWidth}
          bobines={bobines}
          papier={papier}
          isComplete
          isPrinting
          onSpeedChange={() => {}}
          onTourCountChange={() => {}}
          planProdTitle={planProdTitle}
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
