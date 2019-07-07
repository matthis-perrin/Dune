import * as React from 'react';
import styled from 'styled-components';

import {BobinesForm} from '@root/components/apps/plan_prod_editor/bobines_form';
import {OrderableEncrier} from '@root/components/apps/plan_prod_editor/orderable_encrier';
import {ProductionTable} from '@root/components/apps/plan_prod_editor/production_table';
import {TopBar} from '@root/components/apps/plan_prod_editor/top_bar';
import {Bobine, CURVE_EXTRA_SPACE} from '@root/components/common/bobine';
import {BobineMereContent} from '@root/components/common/bobine_mere_content';
import {Perfo as PerfoComponent} from '@root/components/common/perfo';
import {PlanProdComment} from '@root/components/common/plan_prod_comment';
import {Refente as RefenteComponent} from '@root/components/common/refente';
import {WithColor} from '@root/components/core/with_colors';
import {CAPACITE_MACHINE} from '@root/lib/constants';
import {padNumber} from '@root/lib/utils';
import {theme} from '@root/theme';

import {Stock, BobineQuantities, PlanProduction} from '@shared/models';

interface PlanProdViewerProps {
  planProd: PlanProduction;
  width: number;
  stocks: Map<string, Stock[]>;
  cadencier: Map<string, Map<number, number>>;
  bobineQuantities: BobineQuantities[];
  onHeightAvailable?(height: number): void;
}

const PLAN_PROD_NUMBER_DIGIT_COUNT = 5;
const RENDERING_WIDTH = 1100;

export class PlanProdViewer extends React.Component<PlanProdViewerProps> {
  public static displayName = 'PlanProdViewer';
  private readonly containerRef = React.createRef<HTMLDivElement>();

  public constructor(props: PlanProdViewerProps) {
    super(props);
    this.state = {};
  }

  public componentDidMount() {
    const {onHeightAvailable, width} = this.props;
    const container = this.containerRef.current;
    if (onHeightAvailable) {
      const height = container ? container.getBoundingClientRect().height : width;
      onHeightAvailable(height);
    }
  }

  public render(): JSX.Element {
    const {width, planProd, bobineQuantities, cadencier, stocks, onHeightAvailable} = this.props;
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
      comment,
    } = planProd.data;

    const INNER_PADDING = (1.5 * (theme.planProd.basePadding * RENDERING_WIDTH)) / CAPACITE_MACHINE;
    const leftPadding =
      (CURVE_EXTRA_SPACE * (width - 2 * INNER_PADDING)) / (1 - 2 * CURVE_EXTRA_SPACE);
    const INNER_RENDERING_WIDTH = RENDERING_WIDTH - INNER_PADDING - leftPadding;
    const pixelPerMM = INNER_RENDERING_WIDTH / CAPACITE_MACHINE;

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
            width={INNER_RENDERING_WIDTH}
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
    const scale = width / RENDERING_WIDTH;
    const scalingStyles = onHeightAvailable
      ? {transformOrigin: 'left top', transform: `scale(${scale})`}
      : {zoom: scale};

    return (
      <PlanProdEditorContainer ref={this.containerRef} style={scalingStyles}>
        <TopBar
          width={RENDERING_WIDTH}
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
        <Wrapper style={{width: INNER_RENDERING_WIDTH}}>
          <PlanProdComment
            padding={padding}
            comment={comment}
            width={INNER_RENDERING_WIDTH}
            isPrinting
          />
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
  margin: auto;
`;
