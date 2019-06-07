import * as React from 'react';
import styled from 'styled-components';

import {Perfo as PerfoComponent} from '@root/components/common/perfo';
import {Picker} from '@root/components/common/picker';
import {SizeMonitor, SCROLLBAR_WIDTH} from '@root/components/core/size_monitor';
import {bridge} from '@root/lib/bridge';
import {CAPACITE_MACHINE} from '@root/lib/constants';
import {perfosStore} from '@root/stores/list_store';
import {theme} from '@root/theme/default';

import {Perfo} from '@shared/models';

interface Props {}

export class PerfoPickerApp extends React.Component<Props> {
  public static displayName = 'PerfoPickerApp';

  constructor(props: Props) {
    super(props);
  }

  private readonly handlePerfoSelected = (perfo: Perfo) => {
    bridge
      .setPlanPerfo(perfo.ref)
      .then(() => {
        bridge.closeApp().catch(console.error);
      })
      .catch(console.error);
  };

  public render(): JSX.Element {
    return (
      <Picker<Perfo>
        getHash={r => r.ref}
        getSelectable={p => p.selectablePerfos}
        store={perfosStore}
        title="Choix de la perfo"
      >
        {(elements, isSelectionnable) => (
          <SizeMonitor>
            {(width, height) => {
              const filterBarHeight = 32;
              const availableWidth = width - 2 * theme.page.padding - SCROLLBAR_WIDTH;
              const availableHeight = height - filterBarHeight;
              const pixelPerMM = availableWidth / CAPACITE_MACHINE;
              return (
                <PerfoList style={{height: availableHeight}}>
                  {elements.map(r => {
                    const enabled = isSelectionnable(r);
                    return (
                      <PerfoWrapper
                        style={{
                          opacity: enabled ? 1 : 0.35,
                          pointerEvents: enabled ? 'all' : 'none',
                        }}
                        key={r.ref}
                        onClick={() => this.handlePerfoSelected(r)}
                      >
                        <PerfoComponent perfo={r} pixelPerMM={pixelPerMM} />
                      </PerfoWrapper>
                    );
                  })}
                </PerfoList>
              );
            }}
          </SizeMonitor>
        )}
      </Picker>
    );
  }
}

const PerfoList = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  overflow: auto;
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
