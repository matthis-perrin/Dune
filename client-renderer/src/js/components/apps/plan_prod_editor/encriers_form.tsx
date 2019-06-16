import * as React from 'react';
import styled from 'styled-components';

import {Encrier} from '@root/components/apps/plan_prod_editor/encrier';
import {DivProps} from '@root/components/core/common';

import {EncrierColor} from '@shared/lib/encrier';
import {BobineFilleWithPose, Refente} from '@shared/models';

interface EncrierFormProps extends DivProps {
  pixelPerMM: number;
  selectedBobines: BobineFilleWithPose[];
  selectedRefente?: Refente;
  validEncrierColors: EncrierColor[][];
}

export class EncrierForm extends React.Component<EncrierFormProps> {
  public static displayName = 'EncrierForm';

  public render(): JSX.Element {
    const {pixelPerMM, selectedBobines, selectedRefente, validEncrierColors} = this.props;
    return (
      <EncrierFormWrapper>
        {(validEncrierColors[0] || []).reverse().map(encrierColor => (
          <Encrier
            pixelPerMM={pixelPerMM}
            selectedBobines={selectedBobines}
            selectedRefente={selectedRefente}
            encrierColor={encrierColor}
          />
        ))}
      </EncrierFormWrapper>
    );
  }
}

const EncrierFormWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;
