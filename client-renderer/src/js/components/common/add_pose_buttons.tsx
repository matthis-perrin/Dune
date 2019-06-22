import {sum} from 'lodash-es';
import * as React from 'react';

import {Button, ButtonMode} from '@root/components/core/button';
import {getBobineState, getBobinePoseState} from '@root/lib/bobine';
import {bridge} from '@root/lib/bridge';

import {dedupePoseNeutre} from '@shared/lib/bobines_filles';
import {getPoseSize} from '@shared/lib/cliches';
import {
  BobineFilleWithMultiPose,
  BobineQuantities,
  BobineState,
  PlanProductionState,
  POSE_NEUTRE,
  Stock,
} from '@shared/models';

interface AddPoseButtonsProps {
  bobine: BobineFilleWithMultiPose;
  stocks: Map<string, Stock[]>;
  cadencier: Map<string, Map<number, number>>;
  bobineQuantities: BobineQuantities[];
  planProd: PlanProductionState;
}

export class AddPoseButtons extends React.Component<AddPoseButtonsProps> {
  public static displayName = 'AddPoseButtons';

  private readonly handleClick = (pose: number) => {
    const {bobine} = this.props;
    bridge.addPlanBobine(bobine.ref, pose).catch(console.error);
  };

  public render(): JSX.Element {
    const {bobine, planProd, stocks, cadencier, bobineQuantities} = this.props;
    const poses = bobine.availablePoses;
    const filteredPoses = dedupePoseNeutre(poses);
    const tourCount = planProd.tourCount;

    const posesStates = getBobinePoseState(
      bobine.ref,
      filteredPoses,
      planProd.selectedBobines,
      tourCount,
      stocks,
      cadencier,
      bobineQuantities
    );

    return (
      <React.Fragment>
        {posesStates.map(({pose, mode, reason}, index) => {
          return (
            <Button
              style={{padding: '4px 12px', marginRight: 4}}
              mode={mode}
              key={`${bobine.ref}-${index}`}
              onClick={() => this.handleClick(pose)}
              popup={reason}
            >
              {pose === POSE_NEUTRE ? 'neutre' : pose}
            </Button>
          );
        })}
      </React.Fragment>
    );
  }
}
