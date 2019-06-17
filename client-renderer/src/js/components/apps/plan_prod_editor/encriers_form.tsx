import * as React from 'react';
import styled from 'styled-components';

import {Encrier} from '@root/components/apps/plan_prod_editor/encrier';
import {DivProps} from '@root/components/core/common';
import {appStore} from '@root/stores/app_store';

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

  private readonly reorganise = () => {
    const {validEncrierColors} = this.props;
    appStore.openModal(
      <div>
        {validEncrierColors.map((encrierColors, i) => (
          <React.Fragment>
            {this.renderEncriers(encrierColors)}
            <div key={`paddingi${i}`} style={{height: 16}} />
          </React.Fragment>
        ))}
      </div>
    );
  };

  private renderEncriers(encierColors: EncrierColor[]): JSX.Element {
    const {pixelPerMM, selectedBobines, selectedRefente} = this.props;
    const reversedEncrierColors = [...encierColors].reverse();
    return (
      <EncrierFormWrapper>
        {reversedEncrierColors.map(encrierColor => (
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

  public render(): JSX.Element {
    const {validEncrierColors} = this.props;
    return (
      <div style={{position: 'relative'}}>
        <ReorganiseButton onClick={this.reorganise}>Réorganiser</ReorganiseButton>
        {this.renderEncriers(validEncrierColors[0] || [])}
      </div>
    );
  }
}

const EncrierFormWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
`;

const ReorganiseButton = styled.div`
  posiiton: absolute;
  top: 0;
  right: 0;
`;
