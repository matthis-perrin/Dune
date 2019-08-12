import * as React from 'react';

import {Button, ButtonMode} from '@root/components/core/button';
import {getBobinePoseState} from '@root/lib/bobine';
import {bridge} from '@root/lib/bridge';
import {getStartForPlanIndex} from '@root/lib/schedule_utils';

import {dedupePoseNeutre} from '@shared/lib/bobines_filles';
import {
  BobineFilleWithMultiPose,
  BobineQuantities,
  PlanProductionState,
  POSE_NEUTRE,
  Stock,
  PlanProductionInfo,
  Schedule,
} from '@shared/models';

interface AddPoseButtonsProps {
  id: number;
  bobine: BobineFilleWithMultiPose;
  stocks: Map<string, Stock[]>;
  cadencier: Map<string, Map<number, number>>;
  bobineQuantities: BobineQuantities[];
  planProd: PlanProductionState;
  schedule: Schedule;
  planInfo: PlanProductionInfo;
}

export class AddPoseButtons extends React.Component<AddPoseButtonsProps> {
  public static displayName = 'AddPoseButtons';

  private readonly handleClick = (pose: number) => {
    const {bobine, id} = this.props;
    bridge.addPlanBobine(id, bobine.ref, pose).catch(console.error);
  };

  public render(): JSX.Element {
    const {bobine, planProd, stocks, cadencier, bobineQuantities, schedule, planInfo} = this.props;
    const poses = bobine.availablePoses;
    const filteredPoses = dedupePoseNeutre(poses);
    const tourCount = planProd.tourCount;
    const start = getStartForPlanIndex(schedule, planInfo.index);

    const unusedPoses = getBobinePoseState(
      bobine.ref,
      filteredPoses,
      planProd.selectedBobines,
      tourCount,
      stocks,
      cadencier,
      bobineQuantities,
      schedule,
      start
    ).map(({pose, mode, reason}, index) => {
      return (
        <Button
          style={{padding: '4px 12px', marginRight: 4}}
          mode={mode}
          key={`${bobine.ref}-${index}`}
          onClick={() => this.handleClick(pose)}
          popup={reason !== undefined ? <span>{reason}</span> : undefined}
        >
          {pose === POSE_NEUTRE ? 'neutre' : pose}
        </Button>
      );
    });

    const usedPosesNeutres = planProd.selectedBobines.filter(
      b => b.ref === bobine.ref && b.pose === POSE_NEUTRE
    ).length;
    const usedPosesNeutresButton =
      usedPosesNeutres > 0 ? (
        <Button
          mode={ButtonMode.Disabled}
          style={{padding: '4px 12px', marginRight: 4}}
          key={`${bobine.ref}-used-neutre`}
        >
          {`neutre${usedPosesNeutres > 1 ? ` x ${usedPosesNeutres}` : ''}`}
        </Button>
      ) : (
        <React.Fragment />
      );

    const usedPoses = planProd.selectedBobines
      .filter(b => b.ref === bobine.ref && b.pose !== POSE_NEUTRE)
      .sort((b1, b2) => b2.pose - b1.pose)
      .map(({ref, pose}, index) => (
        <Button
          mode={ButtonMode.Disabled}
          style={{padding: '4px 12px', marginRight: 4}}
          key={`${ref}-used-${index}`}
        >
          {pose}
        </Button>
      ));

    return (
      <React.Fragment>
        {unusedPoses}
        {usedPoses}
        {usedPosesNeutresButton}
      </React.Fragment>
    );
  }
}
