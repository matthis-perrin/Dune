import {max} from 'lodash-es';
import * as React from 'react';
import styled from 'styled-components';

import {StaticBobinesForm} from '@root/components/apps/plan_prod_editor/bobines_form';
import {OperationTableView} from '@root/components/apps/plan_prod_editor/operations_table';
import {OrderableEncrier} from '@root/components/apps/plan_prod_editor/orderable_encrier';
import {SimpleProductionTable} from '@root/components/apps/plan_prod_editor/production_table';
import {TopBarView} from '@root/components/apps/plan_prod_editor/top_bar';
import {Bobine, CURVE_EXTRA_SPACE} from '@root/components/common/bobine';
import {SimpleBobineMereContent} from '@root/components/common/bobine_mere_content';
import {Perfo as PerfoComponent} from '@root/components/common/perfo';
import {PlanProdComment} from '@root/components/common/plan_prod_comment';
import {Refente as RefenteComponent} from '@root/components/common/refente';
import {WithColor} from '@root/components/core/with_colors';
import {CAPACITE_MACHINE} from '@root/lib/constants';
import {getPlanProdTitle} from '@root/lib/plan_prod';
import {getPlanStart, getPlanEnd, getProdTime} from '@root/lib/schedule_utils';
import {theme} from '@root/theme';

import {BobineQuantities, ScheduledPlanProd} from '@shared/models';

interface PlanProdViewerProps {
  schedule: ScheduledPlanProd;
  cadencier: Map<string, Map<number, number>>;
  bobineQuantities: BobineQuantities[];
  width: number;
  hideOperationTable?: boolean;
  nonInteractive?: boolean;
  forPrinting?: boolean;
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
      schedule,
      cadencier,
      bobineQuantities,
      hideOperationTable,
      onHeightAvailable,
      nonInteractive,
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
    } = schedule.planProd.data;

    const INNER_PADDING_APPROXIMATION_RATIO = 1.5;
    const INNER_PADDING =
      (INNER_PADDING_APPROXIMATION_RATIO * (theme.planProd.basePadding * RENDERING_WIDTH)) /
      CAPACITE_MACHINE;
    const leftPadding =
      (CURVE_EXTRA_SPACE * (width - 2 * INNER_PADDING)) / (1 - 2 * CURVE_EXTRA_SPACE);
    const INNER_RENDERING_WIDTH = RENDERING_WIDTH - INNER_PADDING - leftPadding;
    const pixelPerMM = INNER_RENDERING_WIDTH / CAPACITE_MACHINE;

    const bobinesBlock = (
      <StaticBobinesForm
        planId={schedule.planProd.id}
        pixelPerMM={pixelPerMM}
        selectedBobines={bobines}
        selectedRefente={refente}
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
        nonInteractive
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
            <SimpleBobineMereContent
              color={color}
              pixelPerMM={pixelPerMM}
              bobine={papier}
              isPolypro={false}
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
            <SimpleBobineMereContent
              color={color}
              pixelPerMM={pixelPerMM}
              bobine={polypro}
              isPolypro
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
          <SimpleProductionTable
            width={INNER_RENDERING_WIDTH}
            planProduction={{selectedBobines: bobines, tourCount}}
            cadencier={cadencier}
            bobineQuantities={bobineQuantities}
            minimums={new Map<string, number>(bobinesMini)}
            maximums={new Map<string, number>(bobinesMax)}
          />
        </React.Fragment>
      ) : (
        <React.Fragment />
      );

    const operationTable = hideOperationTable ? (
      <React.Fragment />
    ) : (
      <React.Fragment>
        <OperationTableView width={INNER_RENDERING_WIDTH} operationsSplits={schedule.operations} />
        {padding}
      </React.Fragment>
    );

    const planProdTitle = getPlanProdTitle(schedule.planProd.id);
    const scale = width / RENDERING_WIDTH;
    const scalingStyles = onHeightAvailable
      ? {transformOrigin: 'left top', transform: `scale(${scale})`}
      : {zoom: scale};

    const start = getPlanStart(schedule);
    const end = getPlanEnd(schedule);
    const prodTime = getProdTime(schedule);
    const {aideConducteur, conducteur, chauffePerfo, chauffeRefente} = schedule.operations;
    const operationTime =
      max([aideConducteur, conducteur, chauffePerfo, chauffeRefente].map(split => split.total)) ||
      0;

    return (
      <PlanProdEditorContainer
        ref={this.containerRef}
        style={scalingStyles}
        nonInteractive={nonInteractive}
      >
        <TopBarView
          width={RENDERING_WIDTH}
          planProdTitle={planProdTitle}
          bobines={bobines}
          papier={papier}
          tourCount={tourCount}
          speed={speed}
          isPrinting
          start={start}
          end={end}
          prodTime={prodTime}
          operationTime={operationTime}
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

const PlanProdEditorContainer = styled.div<{nonInteractive?: boolean}>`
  margin: 0 auto;
  background-color: ${theme.planProd.contentBackgroundColor};
  input {
    pointer-events: ${props => (props.nonInteractive ? 'none' : 'initial')};
  }
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: auto;
`;
