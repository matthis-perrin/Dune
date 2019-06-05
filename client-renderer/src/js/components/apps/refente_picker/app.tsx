import * as React from 'react';
import styled from 'styled-components';

import {Refente as RefenteComponent} from '@root/components/common/refente';
import {SizeMonitor} from '@root/components/core/size_monitor';
import {bridge} from '@root/lib/bridge';
import {theme} from '@root/theme/default';

import {PlanProductionChanged} from '@shared/bridge/commands';
import {Refente} from '@shared/models';

interface Props {
  refentes: Refente[];
}

export class RefentePickerApp extends React.Component<Props> {
  public static displayName = 'RefentePickerApp';

  public componentDidMount(): void {
    bridge.addEventListener(PlanProductionChanged, this.refreshPlanProduction);
  }

  public componentWillUnmount(): void {
    bridge.removeEventListener(PlanProductionChanged, this.refreshPlanProduction);
  }

  private readonly refreshPlanProduction = async (): Promise<void> => {
    const planProduction = await bridge.getPlanProduction();
    document.title = `Choix de la Refente (${planProduction.selectableRefentes.length})`;
    this.setState({planProd: planProduction});
  };

  private readonly handleRefenteSelected = (refente: Refente) => {
    bridge
      .setPlanRefente(refente.ref)
      .then(() => {
        bridge.closeApp().catch(console.error);
      })
      .catch(console.error);
  };

  public render(): JSX.Element {
    const {refentes} = this.props;
    return (
      <div>
        <SizeMonitor>
          {width => {
            const CAPACITE_MACHINE = 980;
            const availableWidth = width - 2 * theme.page.padding;
            const pixelPerMM = availableWidth / CAPACITE_MACHINE;
            return (
              <RefenteList style={{width}}>
                {refentes.map(r => (
                  <RefenteWrapper key={r.ref} onClick={() => this.handleRefenteSelected(r)}>
                    <RefenteComponent refente={r} pixelPerMM={pixelPerMM} />
                  </RefenteWrapper>
                ))}
              </RefenteList>
            );
          }}
        </SizeMonitor>
      </div>
    );
  }
}

const RefenteList = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const RefenteWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 100%;
  box-sizing: border-box;
  padding: ${theme.page.padding}px;
  cursor: pointer;
  &:hover {
    background-color: #eeeeee;
  }
`;
