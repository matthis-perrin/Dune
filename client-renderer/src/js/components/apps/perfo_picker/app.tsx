import * as React from 'react';
import styled from 'styled-components';

import {Perfo as PerfoComponent} from '@root/components/common/perfo';
import {SizeMonitor} from '@root/components/core/size_monitor';
import {bridge} from '@root/lib/bridge';
import {CAPACITE_MACHINE} from '@root/lib/constants';
import {theme} from '@root/theme/default';

import {PlanProductionChanged} from '@shared/bridge/commands';
import {Perfo} from '@shared/models';

interface Props {
  perfos: Perfo[];
}

export class PerfoPickerApp extends React.Component<Props> {
  public static displayName = 'PerfoPickerApp';

  public componentDidMount(): void {
    bridge.addEventListener(PlanProductionChanged, this.refreshPlanProduction);
  }

  public componentWillUnmount(): void {
    bridge.removeEventListener(PlanProductionChanged, this.refreshPlanProduction);
  }

  private readonly refreshPlanProduction = async (): Promise<void> => {
    const planProduction = await bridge.getPlanProduction();
    document.title = `Choix de la perfo (${planProduction.selectablePerfos.length})`;
    this.setState({planProd: planProduction});
  };

  private readonly handlePerfoSelected = (perfo: Perfo) => {
    bridge
      .setPlanPerfo(perfo.ref)
      .then(() => {
        bridge.closeApp().catch(console.error);
      })
      .catch(console.error);
  };

  public render(): JSX.Element {
    const {perfos} = this.props;
    return (
      <SizeMonitor>
        {width => {
          const availableWidth = width - 2 * theme.page.padding;
          const pixelPerMM = availableWidth / CAPACITE_MACHINE;
          return (
            <PerfoList style={{width}}>
              {perfos.map(r => (
                <PerfoWrapper key={r.ref} onClick={() => this.handlePerfoSelected(r)}>
                  <PerfoComponent perfo={r} pixelPerMM={pixelPerMM} />
                </PerfoWrapper>
              ))}
            </PerfoList>
          );
        }}
      </SizeMonitor>
    );
  }
}

const PerfoList = styled.div`
  display: flex;
  flex-direction: column;
`;

const PerfoWrapper = styled.div`
  display: flex;
  justify-content: flex-start;
  width: 100%;
  box-sizing: border-box;
  padding: ${theme.page.padding}px;
  cursor: pointer;
  &:hover {
    background-color: #eeeeee;
  }
`;
