import * as React from 'react';

import {Button} from '@root/components/core/button';
import {bridge} from '@root/lib/bridge';

import {dedupePoseNeutre} from '@shared/lib/bobines_filles';
import {BobineFilleWithMultiPose, POSE_NEUTRE} from '@shared/models';

interface AddPoseButtonsProps {
  bobine: BobineFilleWithMultiPose;
}

export class AddPoseButtons extends React.Component<AddPoseButtonsProps> {
  public static displayName = 'AddPoseButtons';

  private readonly handleClick = (pose: number) => {
    const {bobine} = this.props;
    bridge.addPlanBobine(bobine.ref, pose).catch(console.error);
  };

  public render(): JSX.Element {
    const {bobine} = this.props;
    const poses = bobine.availablePoses;
    const filteredPoses = dedupePoseNeutre(poses);

    return (
      <React.Fragment>
        {filteredPoses.map((pose, index) => (
          <Button key={`${bobine.ref}-${index}`} onClick={() => this.handleClick(pose)}>
            {pose === POSE_NEUTRE ? 'neutre' : pose}
          </Button>
        ))}
      </React.Fragment>
    );
  }
}
