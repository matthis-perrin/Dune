import React from 'react';
import styled from 'styled-components';

import {Perfo as PerfoComponent} from '@root/components/common/perfo';
import {Picker} from '@root/components/common/picker';
import {SizeMonitor, SCROLLBAR_WIDTH} from '@root/components/core/size_monitor';
import {bridge} from '@root/lib/bridge';
import {CAPACITE_MACHINE} from '@root/lib/constants';
import {perfosStore} from '@root/stores/list_store';
import {theme} from '@root/theme';

import {Perfo} from '@shared/models';

interface Props {
  id: number;
}

export class PerfoPickerApp extends React.Component<Props> {
  public static displayName = 'PerfoPickerApp';

  constructor(props: Props) {
    super(props);
  }

  private readonly handlePerfoSelected = (perfo: Perfo) => {
    bridge
      .setPlanPerfo(this.props.id, perfo.ref)
      .then(() => {
        bridge.closeApp().catch(console.error);
      })
      .catch(console.error);
  };

  public render(): JSX.Element {
    const {id} = this.props;
    return (
      <Picker<Perfo>
        id={id}
        getHash={r => r.ref}
        getSelectable={p => p.selectablePerfos}
        store={perfosStore}
        title="Choix de la perfo"
      >
        {(elements, isSelectionnable, planProd, header, footer) => (
          <SizeMonitor>
            {(width, height) => {
              const filterBarHeight = theme.table.footerHeight;
              const availableWidth = width - 2 * theme.page.padding - SCROLLBAR_WIDTH;
              const availableHeight = height - filterBarHeight;
              const pixelPerMM = availableWidth / CAPACITE_MACHINE;
              return (
                <React.Fragment>
                  {header}
                  <PerfoList style={{height: availableHeight}}>
                    {elements.map(r => {
                      const enabled = isSelectionnable(r);
                      return (
                        <PerfoWrapper
                          style={{
                            opacity: enabled ? 1 : theme.table.disabledOpacity,
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
                  {footer}
                </React.Fragment>
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
    background-color: ${theme.perfo.hoverBackgroundColor};
  }
`;
