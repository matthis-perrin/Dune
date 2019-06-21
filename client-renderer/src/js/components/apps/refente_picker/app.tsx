import * as React from 'react';
import styled from 'styled-components';

import {Picker} from '@root/components/common/picker';
import {Refente as RefenteComponent} from '@root/components/common/refente';
import {SizeMonitor, SCROLLBAR_WIDTH} from '@root/components/core/size_monitor';
import {bridge} from '@root/lib/bridge';
import {CAPACITE_MACHINE} from '@root/lib/constants';
import {refentesStore} from '@root/stores/list_store';
import {theme} from '@root/theme';

import {Refente} from '@shared/models';

interface Props {}

export class RefentePickerApp extends React.Component<Props> {
  public static displayName = 'RefentePickerApp';

  constructor(props: Props) {
    super(props);
  }

  private readonly handleRefenteSelected = (refente: Refente) => {
    bridge
      .setPlanRefente(refente.ref)
      .then(() => {
        bridge.closeApp().catch(console.error);
      })
      .catch(console.error);
  };

  public render(): JSX.Element {
    return (
      <Picker<Refente>
        getHash={r => r.ref}
        getSelectable={p => p.selectableRefentes}
        store={refentesStore}
        title="Choix de la refente"
      >
        {(elements, isSelectionnable) => (
          <SizeMonitor>
            {(width, height) => {
              const filterBarHeight = 32;
              const availableWidth = width - 2 * theme.page.padding - SCROLLBAR_WIDTH;
              const availableHeight = height - filterBarHeight;
              const pixelPerMM = availableWidth / CAPACITE_MACHINE;
              return (
                <RefenteList style={{height: availableHeight}}>
                  {elements.map(r => {
                    const enabled = isSelectionnable(r);
                    return (
                      <RefenteWrapper
                        style={{
                          opacity: enabled ? 1 : 0.35,
                          pointerEvents: enabled ? 'all' : 'none',
                        }}
                        key={r.ref}
                        onClick={() => this.handleRefenteSelected(r)}
                      >
                        <RefenteComponent refente={r} pixelPerMM={pixelPerMM} />
                      </RefenteWrapper>
                    );
                  })}
                </RefenteList>
              );
            }}
          </SizeMonitor>
        )}
      </Picker>
    );
  }
}

const RefenteList = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  overflow: auto;
`;

const RefenteWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 100%;
  box-sizing: border-box;
  padding: ${theme.page.padding}px;
  cursor: pointer;
  &:hover {
    background-color: ${theme.refente.hoverBackgroundColor};
  }
`;
