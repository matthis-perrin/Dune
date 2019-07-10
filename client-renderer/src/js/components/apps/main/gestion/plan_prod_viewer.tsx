import * as React from 'react';
import styled from 'styled-components';

import {BobinesForm} from '@root/components/apps/plan_prod_editor/bobines_form';
import {OperationTable} from '@root/components/apps/plan_prod_editor/operations_table';
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
import {getPlanProdTitle, getPreviousPlanProd} from '@root/lib/plan_prod';
import {theme} from '@root/theme';

import {Stock, BobineQuantities, PlanProduction, Operation} from '@shared/models';

interface PlanProdViewerProps {
  planProd: PlanProduction;
  width: number;
  stocks: Map<string, Stock[]>;
  plansProd: PlanProduction[];
  cadencier: Map<string, Map<number, number>>;
  bobineQuantities: BobineQuantities[];
  operations: Operation[];
  onHeightAvailable?(height: number): void;
}

const RENDERING_WIDTH = 1100;

export class PlanProdViewer extends React.Component<PlanProdViewerProps> {
  public static displayName = 'PlanProdViewer';
  private readonly containerRef = React.createRef<HTMLDivElement>();

  public constructor(props: PlanProdViewerProps) {
    super(props);
    this.state = {};
  }

  public componentDidMount(): void {
    const {onHeightAvailable, width} = this.props;
    const container = this.containerRef.current;
    if (onHeightAvailable) {
      const height = container ? container.getBoundingClientRect().height : width;
      onHeightAvailable(height);
    }
  }

  public render(): JSX.Element {
    const {
      width,
      planProd,
      bobineQuantities,
      cadencier,
      stocks,
      plansProd,
      operations,
      onHeightAvailable,
    } = this.props;
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

    const INNER_PADDING_APPROXIMATION_RATIO = 1.5;
    const INNER_PADDING =
      (INNER_PADDING_APPROXIMATION_RATIO * (theme.planProd.basePadding * RENDERING_WIDTH)) /
      CAPACITE_MACHINE;
    const leftPadding =
      (CURVE_EXTRA_SPACE * (width - 2 * INNER_PADDING)) / (1 - 2 * CURVE_EXTRA_SPACE);
    const INNER_RENDERING_WIDTH = RENDERING_WIDTH - INNER_PADDING - leftPadding;
    const pixelPerMM = INNER_RENDERING_WIDTH / CAPACITE_MACHINE;

    const bobinesBlock = (
      <BobinesForm
        planId={planProd.id}
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
              plansProd={plansProd}
              info={planProd}
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
              bobine={polypro}
              isPolypro
              stocks={stocks}
              plansProd={plansProd}
              info={planProd}
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
            planInfo={planProd}
            plansProd={plansProd}
          />
        </React.Fragment>
      ) : (
        <React.Fragment />
      );

    const previousPlanProd = getPreviousPlanProd(planProd, plansProd || []);

    const operationTable = previousPlanProd ? (
      <React.Fragment>
        <OperationTable
          width={INNER_RENDERING_WIDTH}
          planProduction={planProd.data}
          previousPlanProduction={previousPlanProd.data}
          operations={operations}
        />
        {padding}
      </React.Fragment>
    ) : (
      <React.Fragment />
    );

    const planProdTitle = getPlanProdTitle(planProd.id);
    const scale = width / RENDERING_WIDTH;
    const scalingStyles = onHeightAvailable
      ? {transformOrigin: 'left top', transform: `scale(${scale})`}
      : {zoom: scale};

    return (
      <PlanProdEditorContainer ref={this.containerRef} style={scalingStyles}>
        <TopBar
          stocks={stocks}
          width={RENDERING_WIDTH}
          bobines={bobines}
          papier={papier}
          polypro={polypro}
          refente={refente}
          perfo={perfo}
          isComplete
          isPrinting
          onSpeedChange={() => {}}
          onTourCountChange={() => {}}
          planProdTitle={planProdTitle}
          speed={speed}
          tourCount={tourCount}
          planProdInfo={planProd}
          plansProd={plansProd}
          encriers={encriers}
          operations={operations}
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
          {operationTable}
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
